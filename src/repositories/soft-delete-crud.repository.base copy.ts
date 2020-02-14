import {
  DefaultCrudRepository,
  Filter,
  Where,
  DataObject,
  EntityNotFoundError,
  Model,
  Entity,
  juggler,
} from '@loopback/repository';
import {Count, AnyObject} from 'loopback-datasource-juggler';
import {getFilterSchemaFor, SchemaObject} from '@loopback/rest';

type SoftDeleteEntity = Entity & {deletedAt?: null | string};

interface SoftDeleteFilter<T extends SoftDeleteEntity> extends Filter<T> {
  withDeleted?: boolean | string;
  onlyDeleted?: boolean | string;
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

  // NOCHANGE create(entity: DataObject<T>, options?: Options): Promise<T>;
  // NOCHANGE createAll(entities: DataObject<T>[], options?: Options): Promise<T[]>;
  // NOCHANGE save(entity: T, options?: Options): Promise<T>;
  // CHANGE find(filter?: SoftDeleteFilter<T>, options?: Options): Promise<(T & Relations)[]>;
  // Change findOne(filter?: SoftDeleteFilter<T>, options?: Options): Promise<(T & Relations) | null>;
  // findById(id: ID, filter?: SoftDeleteFilter<T>, options?: Options): Promise<T & Relations>;
  // NOCHANGE update(entity: T, options?: Options): Promise<void>;
  // NOCHANGE delete(entity: T, options?: Options): Promise<void>;
  // ?? updateAll(data: DataObject<T>, where?: Where<T>, options?: Options): Promise<Count>;
  // ?? updateById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
  // ?? replaceById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
  // ?? deleteAll(where?: Where<T>, options?: Options): Promise<Count>;
  // ?? deleteById(id: ID, options?: Options): Promise<void>;
  // ?? count(where?: Where<T>, options?: Options): Promise<Count>;
  // ?? exists(id: ID, options?: Options): Promise<boolean>;

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
      (filter.onlyDeleted === true || filter.onlyDeleted === 'true')
    ) {
      where = {deletedAt: {lt: new Date().toISOString()}};
    }
    // If deleted Entities should be shown as well
    else if (
      filter &&
      (filter.withDeleted === true || filter.withDeleted === 'true')
    )
      return this.deleteFilter(filter);
    else {
      where = {
        deletedAt: {inq: [null, undefined]},
      };
    }

    return this.deleteFilter(this.combineWhereClause(where, filter));
  }

  // /**
  //  * @param entity
  //  * @param options
  //  */
  // save(entity: T, options?: AnyObject | undefined): Promise<T> {
  // // Do Something
  // // Now call super
  //   return super.save(entity, options);
  // }

  // /**
  //  * @param entity
  //  * @param options
  //  */
  // update(entity: T, options?: AnyObject | undefined): Promise<voId> {
  //   // Do Something
  //   // Now call super
  //   return super.update(entity, options);
  // }

  /**
   * Method to perform soft delete.
   * @param entity
   * @param options
   */
  delete(entity: T, options?: AnyObject | undefined): Promise<void> {
    entity.deletedAt = new Date().toISOString();
    return super.update(entity, options);
  }

  /**
   * Method to perform restore soft deleted.
   * @param entity
   * @param options
   */
  restore(entity: T, options?: AnyObject | undefined): Promise<void> {
    entity.deletedAt = null;
    return super.update(entity, options);
  }

  /**
   * Method to perform hard delete of entries. Take caution!
   * @param entity
   * @param options
   */
  deleteHard(entity: T, options?: AnyObject | undefined): Promise<void> {
    return super.delete(entity, options);
  }

  /**
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

  // updateById(
  //   id: ID,
  //   data: DataObject<T>,
  //   options?: AnyObject | undefined,
  // ): Promise<void> {
  //   // Do Something
  //   // Now call super
  //   return super.updateById(id, data, options);
  // }

  // replaceById?<IdType>(
  //   modelClass: Class<Entity>,
  //   Id: IdType,
  //   data: EntityData,
  //   options?: AnyObject | undefined,
  // ): Promise<boolean>;

  /**
   * Method to perform restore soft deleted.
   * @param Id
   * @param options
   */
  restoreById(id: ID, options?: AnyObject | undefined): Promise<void> {
    return this.updateById(
      id,
      {
        deletedAt: null,
      } as T,
      options,
    );
  }

  /**
   * Method to perform soft delete.
   * @param Id
   * @param options
   */
  deleteById(id: ID, options?: AnyObject | undefined): Promise<void> {
    return this.updateById(
      id,
      {
        deletedAt: new Date().toISOString(),
      } as T,
      options,
    );
  }

  /**
   * Method to perform hard delete of entries. Take caution.
   * @param entity
   * @param options
   */
  deleteByIdHard(id: ID, options?: AnyObject | undefined): Promise<void> {
    return super.deleteById(id, options);
  }

  // exists(id: ID, options?: AnyObject | undefined) {
  //   // Do Something
  //   // Now call super
  //   return super.exists(id, options);
  // }

  // execute(
  //   command: Command,
  //   parameters: any[] | AnyObject,
  //   options?: AnyObject | undefined,
  // ) {
  //   // Do Something
  //   // Now call super
  //   return super.execute(command, parameters, options);
  // }

  // /**
  //  *
  //  * @param entity
  //  * @param options
  //  */
  // create(entity: DataObject<T>, options?: AnyObject | undefined): Promise<T> {
  //   return super.create(entity, options);
  // }

  // /**
  //  *
  //  * @param entities
  //  * @param options
  //  */
  // createAll(entities: DataObject<T>[], options?: AnyObject | undefined) {
  //   return super.createAll(entities, options);
  // }

  /**
   * Find entity
   * @param filter
   * @param options
   */
  find(
    filter?: SoftDeleteFilter<T>,
    options?: AnyObject | undefined,
  ): Promise<(T & Relations)[]> {
    // Filter out soft deleted entries
    filter = this.addDeleteWhereClause(filter);

    // Now call super
    return super.find(filter, options);
  }

  /**
   * Update all
   * @param data
   * @param where
   * @param options
   */
  updateAll(
    data: DataObject<T>,
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    const filter: SoftDeleteFilter<T> = this.addDeleteWhereClause({where});

    return super.updateAll(data, filter.where, options);
  }

  /**
   * Method to perform soft delete.
   * @param where
   * @param options
   */
  async deleteAll(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    return this.updateAll(
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
    return this.updateAll(
      {
        deletedAt: null,
      } as T,
      where,
      options,
    );
  }

  /**
   * Method to perform hard delete of entries. Take caution.
   * @param entity
   * @param options
   */
  deleteAllHard(
    where?: Where<T>,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    return super.deleteAll(where, options);
  }

  /**
   * Find one entity.
   * @param filter
   * @param options
   */
  findOne(
    filter?: SoftDeleteFilter<T>,
    options?: AnyObject | undefined,
  ): Promise<T & Relations | null> {
    filter = this.addDeleteWhereClause(filter);
    return super.findOne(filter, options);
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
