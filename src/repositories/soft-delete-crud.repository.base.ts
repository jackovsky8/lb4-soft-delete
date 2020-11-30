import {
  DefaultCrudRepository,
  Filter,
  Where,
  DataObject,
  Model,
  Entity,
  juggler,
  EntityNotFoundError,
  Options,
} from '@loopback/repository';
import {Count, AnyObject} from 'loopback-datasource-juggler';
import {getFilterSchemaFor, SchemaObject} from '@loopback/rest';

type SoftDeleteEntity = Entity & {deletedAt?: null | string};

interface SoftDeleteFilter<T extends SoftDeleteEntity> extends Filter<T> {
  withDeleted?: boolean; // | string;
  onlyDeleted?: boolean; // | string;
}

/**
 * getSoftDeleteFilterFor
 * including withDeleted & onlyDeleted to the filterSchema
 * @param modelCtor
 */
export function getSoftDeleteFilterSchemaFor(
  modelCtor: typeof Model,
): SchemaObject {
  let filterSchema: SchemaObject = getFilterSchemaFor(modelCtor);

  filterSchema = {
    ...filterSchema,
    properties: {
      ...filterSchema.properties,
      withDeleted: {type: 'boolean'},
      onlyDeleted: {type: 'boolean'},
    },
  };

  return filterSchema;
}

export class SoftDeleteCrudRepository<
  T extends SoftDeleteEntity,
  ID,
  Relations extends object = {}
> extends DefaultCrudRepository<T, ID, Relations> {
  constructor(
    entityClass: typeof Entity & {
      prototype: T;
    },
    dataSource: juggler.DataSource,
  ) {
    super(entityClass, dataSource);
  }

  /**
   * combineWhereClause
   * @param toAdd
   * @param filter
   */
  private combineWhereClause(
    // TODO Where<T>?
    toAdd: Where<SoftDeleteEntity>,
    filter?: SoftDeleteFilter<T>,
  ): SoftDeleteFilter<T> {
    filter = filter || {};
    // TODO Where<T>?
    (filter.where as Where<SoftDeleteEntity>) = filter.where
      ? {and: [{...filter.where}, toAdd]}
      : toAdd;

    return filter;
  }

  /**
   * deleteFilter
   * @param filter
   */
  private deleteFilter(filter: SoftDeleteFilter<T>): SoftDeleteFilter<T> {
    delete filter.withDeleted;
    delete filter.onlyDeleted;
    return filter;
  }

  /**
   * Add where clause for filtering deleted Entities
   * @param filter
   */
  private addDeleteWhereClause(
    filter?: SoftDeleteFilter<T>,
  ): SoftDeleteFilter<T> {
    // TODO - Why not working with Where<T>?
    let where: Where<SoftDeleteEntity>;
    // If only deleted Entities should be shown
    if (
      filter &&
      filter.onlyDeleted === true // || filter.onlyDeleted === 'true')
    ) {
      // TODO WITHOUT TIME
      // Work around for bug when i just take new Date()
      const now = new Date();
      where = {deletedAt: {lt: new Date(now.getTime() + 60000).toISOString()}};
    }
    // If deleted Entities should be shown as well
    else if (
      filter &&
      filter.withDeleted === true // || filter.withDeleted === 'true')
    )
      return this.deleteFilter(filter);
    else {
      where = {
        deletedAt: {inq: [null, undefined]},
      };
    }

    return this.deleteFilter(this.combineWhereClause(where, filter));
  }

  // NOCHANGE create(entity: DataObject<T>, options?: Options): Promise<T>;
  // NOCHANGE createAll(entities: DataObject<T>[], options?: Options): Promise<T[]>;
  // NOCHANGE ?? save(entity: T, options?: Options): Promise<T>;
  // CHANGE find(filter?: SoftDeleteFilter<T>, options?: Options): Promise<(T & Relations)[]>;
  // CHANGE findOne(filter?: SoftDeleteFilter<T>, options?: Options): Promise<(T & Relations) | null>;
  // CHANGE findById(id: ID, filter?: SoftDeleteFilter<T>, options?: Options): Promise<T & Relations>;
  // CHANGE update (entity: T, options?: Options): Promise<void>;
  // CHANGE delete(entity: T, options?: Options): Promise<void>;
  // NEW restore(entity: T, options?: Options): Promise<void>;
  // NEW deleteHard(entity: T, options?: Options): Promise<void>;
  // CHANGE updateAll(data: DataObject<T>, where?: Where<T>, options?: Options): Promise<Count>;
  // CHANGE updateById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
  // CHANGE replaceById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
  // CHANGE deleteAll(where?: Where<T>, options?: Options): Promise<Count>;
  // NEW restoreAll(where?: Where<T>, options?: Options): Promise<Count>;
  // NEW deleteHardAll(where?: Where<T>, options?: Options): Promise<Count>;
  // CHANGE deleteById(id: ID, options?: Options): Promise<void>;
  // NEW restoreById(id: ID, options?: Options): Promise<void>;
  // NEW deleteHardById(id: ID, options?: Options): Promise<void>;
  // CHANGE count(where?: Where<T>, options?: Options): Promise<Count>;
  // NEW countOnlyDeleted(where?: Where<T>, options?: Options): Promise<Count>;
  // NEW countWithDeleted(where?: Where<T>, options?: Options): Promise<Count>;
  // NOCHANGE ?? exists(id: ID, options?: Options): Promise<boolean>;

  /**
   * Find entity
   * @param filter - added withDeleted & onlyDeleted
   * @param options
   */
  find(
    filter?: SoftDeleteFilter<T>,
    options?: AnyObject | undefined,
  ): Promise<(T & Relations)[]> {
    // Add the filter withDeleted and onlyDeleted to the where clause of the filter
    filter = this.addDeleteWhereClause(filter);

    return super.find(filter, options);
  }

  /**
   * Find one entity.
   * @param filter
   * @param options
   */
  findOne(
    filter?: SoftDeleteFilter<T>,
    options?: AnyObject | undefined,
  ): Promise<(T & Relations) | null> {
    // Add the filter withDeleted and onlyDeleted to the where clause of the filter
    filter = this.addDeleteWhereClause(filter);

    return super.findOne(filter, options);
  }

  /**
   * Find an entity by id, return a rejected promise if not found.
   * @param Id
   * @param filter
   * @param options
   */
  async findById(
    id: ID,
    filter?: SoftDeleteFilter<T>,
    options?: AnyObject | undefined,
  ): Promise<T & Relations> {
    const where: Where<T> = this.entityClass.buildWhereForId(id);

    filter = this.combineWhereClause(where, filter);
    filter = this.addDeleteWhereClause(filter);

    const result = await super.findOne(filter, options);

    // If no result is found, throw error
    if (!result) throw new EntityNotFoundError(this.entityClass, id);

    return result;
  }

  /**
   * Update an entity
   * @param entity
   * @param options
   */
  update(entity: T, options?: AnyObject | undefined): Promise<void> {
    return this.updateById(entity.getId(), entity, options);
  }

  /**
   * Soft delete an entity
   * @param entity
   * @param options
   */
  delete(entity: T, options?: AnyObject | undefined): Promise<void> {
    return this.deleteById(entity.getId(), options);
  }

  /**
   * Restore an soft deleted entity
   * @param entity
   * @param options
   */
  restore(entity: T, options?: AnyObject | undefined): Promise<void> {
    return this.restoreById(entity.getId(), options);
  }

  /**
   * Method to perform hard delete of entries. Take caution!
   * @param entity
   * @param options
   */
  deleteHard(entity: T, options?: AnyObject | undefined): Promise<void> {
    return this.deleteHardById(entity.getId(), options);
  }

  /**
   * Update all.
   * Soft deleted entities are ignored.
   * @param data
   * @param where
   * @param options
   */
  updateAll(
    data: DataObject<T>,
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    where = this.addDeleteWhereClause({where}).where;

    return super.updateAll(data, where, options);
  }

  async updateById(
    id: ID,
    data: DataObject<T>,
    options?: AnyObject | undefined,
  ): Promise<void> {
    let where = this.entityClass.buildWhereForId(id);
    where = this.addDeleteWhereClause(where);

    const entity = await this.findOne(where);

    if (!entity) throw new EntityNotFoundError(this.entityClass, id);

    return super.updateById(entity.getId(), data, options);
  }

  /**
   * Replace an entity by id
   * @param id
   * @param data
   * @param options
   */
  async replaceById(
    id: ID,
    data: DataObject<T>,
    options?: Options,
  ): Promise<void> {
    let where = this.entityClass.buildWhereForId(id);
    where = this.addDeleteWhereClause(where);

    const entity = await this.findOne(where);

    if (!entity) throw new EntityNotFoundError(this.entityClass, id);

    return super.replaceById(entity.getId(), data, options);
  }

  /**
   * Soft delete matching records
   * @param where
   * @param options
   */
  async deleteAll(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    // Don't delete already deleted Entities.
    where = this.addDeleteWhereClause({where}).where;

    return super.updateAll(
      {
        deletedAt: new Date().toISOString(),
      } as T,
      where,
      options,
    );
  }

  /**
   * Method to perform restore soft deleted.
   * @param where
   * @param options
   */
  restoreAll(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    // Don't restore not deleted Entities.
    where = this.addDeleteWhereClause({where, onlyDeleted: true}).where;

    return super.updateAll(
      {
        deletedAt: null,
      } as T,
      where,
      options,
    );
  }

  /**
   * Method to perform hard delete of entries. Only already soft deleted Entities are acknowledged. Take caution.
   * @param entity
   * @param options
   */
  deleteAllHard(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    // Only hard delete already soft deleted onces.
    where = this.addDeleteWhereClause({where, onlyDeleted: true}).where;

    return super.deleteAll(where, options);
  }

  /**
   * Method to perform soft delete.
   * @param Id
   * @param options
   */
  async deleteById(id: ID, options?: AnyObject | undefined): Promise<void> {
    // Don't delete already deleted Entities.
    const entity: T & Relations = await this.findById(id, {}, options);

    entity.deletedAt = new Date().toISOString();

    await super.update(entity, options);
  }

  /**
   * Method to perform restore soft deleted.
   * @param Id
   * @param options
   */
  async restoreById(id: ID, options?: AnyObject | undefined): Promise<void> {
    // Don't restore not deleted Entities.
    const entity: T & Relations = await this.findById(
      id,
      {onlyDeleted: true},
      options,
    );

    entity.deletedAt = null;

    await super.update(entity, options);
  }

  /**
   * Method to perform hard delete of entries. Take caution.
   * @param entity
   * @param options
   */
  async deleteHardById(id: ID, options?: AnyObject | undefined): Promise<void> {
    // Only hard delete already soft deleted onces.
    const entity: T & Relations = await this.findById(
      id,
      {onlyDeleted: true},
      options,
    );

    await super.deleteById(entity.getId(), options);
  }

  /**
   * Count matching records, without soft deleted ones.
   * @param where
   * @param options
   */
  count(where?: Where<T>, options?: AnyObject | undefined): Promise<Count> {
    const filter: SoftDeleteFilter<T> = this.addDeleteWhereClause({where});
    return super.count(filter.where, options);
  }

  /**
   * Count matching records, only soft deleted ones.
   * @param where
   * @param options
   */
  countOnlyDeleted(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    let filter: SoftDeleteFilter<T> = {
      onlyDeleted: true,
    };
    filter = this.addDeleteWhereClause(filter);
    return super.count(filter.where, options);
  }

  /**
   * Count matching records, with soft deleted ones.
   * @param where
   * @param options
   */
  countWithDeleted(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    let filter: SoftDeleteFilter<T> & {withDeleted?: boolean | string} = {
      withDeleted: true,
    };
    filter = this.addDeleteWhereClause(filter);
    return super.count(filter.where, options);
  }
}
