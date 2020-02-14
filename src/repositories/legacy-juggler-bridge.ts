import {
  TransactionalEntityRepository,
  juggler,
  // InclusionResolver,
  DataObject,
  ensurePromise,
  EntityNotFoundError,
  Where,
  Entity,
  IsolationLevel,
  Transaction,
  Filter,
  DefaultCrudRepository,
} from '@loopback/repository';
import {SoftDeleteEntity} from '../model';
import {Options, Count} from 'loopback-datasource-juggler';
import {SoftDeleteFilter} from '../query';
import {SoftDeleteEntityCrudRepository} from './repository';

/**
 * Default implementation of CRUD repository using legacy juggler model
 * and data source
 */
export class SoftDeleteCrudRepository<
  T extends SoftDeleteEntity,
  ID,
  Relations extends object = {}
> extends DefaultCrudRepository<T, ID, Relations>
  implements SoftDeleteEntityCrudRepository<T, ID, Relations> {
  /**
   * Constructor of DefaultCrudRepository
   * @param entityClass - Legacy entity class
   * @param dataSource - Legacy data source
   */
  constructor(
    // entityClass should have type "typeof T", but that's not supported by TSC
    public entityClass: typeof SoftDeleteEntity & {prototype: T},
    public dataSource: juggler.DataSource,
  ) {
    super(entityClass, dataSource);
  }

  async save(entity: T, options?: Options): Promise<T> {
    const id = this.entityClass.getIdOf(entity);
    if (id == null) {
      return super.create(entity, options);
    } else {
      await this.replaceById(id, entity, options);
      return new this.entityClass(entity.toObject()) as T;
    }
  }

  async find(
    filter?: SoftDeleteFilter<T>,
    options?: Options,
  ): Promise<(T & Relations)[]> {
    // Add Where Clause
    const newFilter: Filter<T> = this.entityClass.addWhereForSoftDelete<T>(
      filter,
    );
    return super.find(newFilter, options);
  }

  findOne(
    filter?: SoftDeleteFilter<T>,
    options?: Options,
  ): Promise<(T & Relations) | null> {
    filter = this.entityClass.addWhereForSoftDelete(filter);

    return super.findOne(filter, options);
  }

  async findById(
    id: ID,
    filter?: SoftDeleteFilter<T>,
    options?: Options,
  ): Promise<T & Relations> {
    filter = filter || {};
    (filter.where as Where<T>) = this.entityClass.buildWhereForId(id);

    filter = this.entityClass.addWhereForSoftDelete(filter);

    const result = await super.findOne(filter, options);
    if (!result) throw new EntityNotFoundError(this.entityClass, id);

    return result;
  }

  update(entity: T, options?: Options): Promise<void> {
    return this.updateById(entity.getId(), entity, options);
  }

  delete(entity: T, options?: Options): Promise<void> {
    return this.deleteById(entity.getId(), options);
  }

  deleteHard(entity: T, options?: Options): Promise<void> {
    return this.deleteHardById(entity.getId(), options);
  }

  restore(entity: T, options?: Options): Promise<void> {
    return this.restoreById(entity.getId(), options);
  }

  async updateAll(
    data: DataObject<T>,
    where?: Where<T>,
    options?: Options,
  ): Promise<Count> {
    where = this.entityClass.addWhereForSoftDelete({where}).where;

    return super.updateAll(data, where, options);
  }

  async updateById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    let where: Where<T> | undefined = this.entityClass.buildWhereForId(id);
    where = this.entityClass.addWhereForSoftDelete({where}).where;

    const entity = await this.findOne({where});

    if (!entity) throw new EntityNotFoundError(this.entityClass, id);

    return super.updateById(entity.getId(), data, options);
  }

  async replaceById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    let filter: Filter<T> = {
      where: this.entityClass.buildWhereForId(id),
    };
    filter = this.entityClass.addWhereForSoftDelete(filter);

    const entity = await this.findOne(filter);
    if (!entity) throw new EntityNotFoundError(this.entityClass, id);

    return super.replaceById(entity.getId(), data, options);
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    // Don't delete already deleted Entities.
    where = this.entityClass.addWhereForSoftDelete({where}).where;

    return super.updateAll(
      {
        deletedAt: new Date().toISOString(),
      } as T,
      where,
      options,
    );
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    // TODO WHy not working??
    // // Throws EntityNotFound when already deleted
    // await this.findById(id, {}, options);

    // const partial: DataObject<T> = {
    //   deletedAt: new Date().toISOString(),
    // };

    // await super.updateById(id, partial, options);

    // TODO Delete Code Below when top is working
    // Throws EntityNotFound when already deleted
    const entity = await this.findById(id, undefined, options);

    entity.deletedAt = new Date().toISOString();

    await super.update(entity, options);
  }

  async deleteHardById(id: ID, options?: Options): Promise<void> {
    // Only hard delete already soft deleted onces.
    await this.findById(id, {onlyDeleted: true}, options);

    await super.deleteById(id, options);
  }

  async restoreById(id: ID, options?: Options): Promise<void> {
    // Don't restore not deleted Entities.
    const entity = await this.findById(id, {onlyDeleted: true}, options);

    if (
      typeof this.entityClass.definition.properties.deletedAt.default ===
      undefined
    )
      delete entity.deletedAt;
    else
      entity.deletedAt = this.entityClass.definition.properties.deletedAt.default;

    await super.replaceById(id, entity, options);
  }

  async count(where?: Where<T>, options?: Options): Promise<Count> {
    const filter: SoftDeleteFilter<T> = this.entityClass.addWhereForSoftDelete({
      where,
    });
    return super.count(filter.where, options);
  }

  async countWithDeleted(where?: Where<T>, options?: Options): Promise<Count> {
    let filter: SoftDeleteFilter<T> = {
      withDeleted: true,
      where,
    };
    filter = this.entityClass.addWhereForSoftDelete(filter);
    return super.count(filter.where, options);
  }

  async countOnlyDeleted(where?: Where<T>, options?: Options): Promise<Count> {
    let filter: SoftDeleteFilter<T> = {
      onlyDeleted: true,
      where,
    };
    filter = this.entityClass.addWhereForSoftDelete(filter);
    return super.count(filter.where, options);
  }

  exists(id: ID, options?: Options): Promise<boolean> {
    return ensurePromise(this.modelClass.exists(id, options));
  }
}

/**
 * Default implementation of CRUD repository using legacy juggler model
 * and data source with beginTransaction() method for connectors which
 * support Transactions
 */
export class SoftDeleteTransactionalRepository<
  T extends Entity,
  ID,
  Relations extends object = {}
> extends SoftDeleteCrudRepository<T, ID, Relations>
  implements TransactionalEntityRepository<T, ID, Relations> {
  async beginTransaction(
    options?: IsolationLevel | Options,
  ): Promise<Transaction> {
    const dsOptions: juggler.IsolationLevel | Options = options || {};
    // juggler.Transaction still has the Promise/Callback variants of the
    // Transaction methods
    // so we need it cast it back
    return (await this.dataSource.beginTransaction(dsOptions)) as Transaction;
  }
}
