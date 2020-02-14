import {
  Entity,
  DataObject,
  Where,
  Filter,
  WhereBuilder,
  TypeResolver,
  model,
} from '@loopback/repository';
import {SoftDeleteFilter} from './query';
import {softDeleteProperty} from './decorators';

export abstract class SoftDeleteBaseEntity extends Entity {
  constructor(data?: DataObject<SoftDeleteEntity>) {
    super(data);
  }
  /**
   * Build the where clause for deletedAt
   * @param id - The id value
   */
  static buildWhereForSoftDelete<MT extends SoftDeleteEntity>(
    withDeleted = false,
    onlyDeleted = false,
  ): Where<MT> | undefined {
    let where: Where<MT> | undefined;

    const builder = new WhereBuilder<MT & SoftDeleteEntity>();

    if (onlyDeleted === true) {
      // If only deleted Entities should be shown
      const date = new Date();
      where = builder.lte('deletedAt', date.toISOString()).build();
    } else if (withDeleted === false) {
      // If also deleted Entities should be shown
      where = builder.eq('deletedAt', null).build();
    }

    return where;
  }

  /**
   * Deletes the extra keys from Soft Delete Filter (withDeleted, onlyDeleted)
   * @param filter
   * @return filter
   */
  static deleteSoftDeleteFilter<MT extends SoftDeleteEntity>(
    filter: SoftDeleteFilter<MT>,
  ): Filter<MT> {
    // Delete the extra keys
    if (filter.withDeleted) delete filter.withDeleted;
    if (filter.onlyDeleted) delete filter.onlyDeleted;

    return filter;
  }

  /**
   * Take Soft Delete filter and combine where column with a corresponding deletedAt where clause
   * @param filter
   * @return filter
   */
  static addWhereForSoftDelete<MT extends SoftDeleteEntity>(
    filter: SoftDeleteFilter<MT> | undefined,
  ): Filter<MT> {
    const withDeleted = filter && filter.withDeleted;
    const onlyDeleted = filter && filter.onlyDeleted;

    filter = filter || {};

    const where: Where<MT> | undefined = this.buildWhereForSoftDelete(
      withDeleted,
      onlyDeleted,
    );

    const builder: WhereBuilder<MT & SoftDeleteEntity> = new WhereBuilder<
      MT & SoftDeleteEntity
    >();

    if (where && filter.where) builder.and(where, filter.where);
    else if (where) builder.where = where;
    else if (filter.where) builder.where = filter.where;
    else filter.where = undefined;

    filter.where = builder.build();

    return this.deleteSoftDeleteFilter(filter);
  }
}

/**
 * Base class for soft delete entities which have deletedAt column
 */
@model({
  name: 'SoftDeleteEntity',
})
export abstract class SoftDeleteEntity extends SoftDeleteBaseEntity {
  constructor(data?: DataObject<SoftDeleteEntity>) {
    super(data);
  }

  @softDeleteProperty()
  deletedAt?: string | null;
}

export type SoftDeleteEntityData = DataObject<SoftDeleteEntity>;

export type SoftDeleteEntityResolver<T extends SoftDeleteEntity> = TypeResolver<
  T,
  typeof SoftDeleteEntity
>;
