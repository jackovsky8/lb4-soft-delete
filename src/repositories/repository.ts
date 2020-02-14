import {SoftDeleteEntity} from '../model';
import {
  EntityCrudRepository,
  // Options,
  // DataObject,
  // Filter,
  // InclusionResolver,
} from '@loopback/repository';

/**
 * CRUD operations for a repository of soft delete entities
 */
export interface SoftDeleteEntityCrudRepository<
  T extends SoftDeleteEntity,
  ID,
  Relations extends object = {}
> extends EntityCrudRepository<T, ID> {
  // TODO - declare the functions with description
  // /**
  //  * Save an entity. If no id is present, create a new entity
  //  * @param entity - Entity to be saved
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // save(entity: DataObject<T>, options?: Options): Promise<T>;
  // /**
  //  * Update an entity
  //  * @param entity - Entity to be updated
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // update(entity: DataObject<T>, options?: Options): Promise<void>;
  // /**
  //  * Delete an entity
  //  * @param entity - Entity to be deleted
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // delete(entity: DataObject<T>, options?: Options): Promise<void>;
  // /**
  //  * Find an entity by id, return a rejected promise if not found.
  //  * @param id - Value for the entity id
  //  * @param filter - Additional query options. E.g. `filter.include` configures
  //  * which related models to fetch as part of the database query (or queries).
  //  * @param options - Options for the operations
  //  * @returns A promise of an entity found for the id
  //  */
  // findById(
  //   id: ID,
  //   filter?: Filter<T>,
  //   options?: Options,
  // ): Promise<T & Relations>;
  // /**
  //  * Update an entity by id with property/value pairs in the data object
  //  * @param id - Value for the entity id
  //  * @param data - Data attributes to be updated
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // updateById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
  // /**
  //  * Replace an entity by id
  //  * @param id - Value for the entity id
  //  * @param data - Data attributes to be replaced
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // replaceById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
  // /**
  //  * Delete an entity by id
  //  * @param id - Value for the entity id
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // deleteById(id: ID, options?: Options): Promise<void>;
  // /**
  //  * Delete an entity hard by id
  //  * @param id - Value for the entity id
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // deleteHardById(id: ID, options?: Options): Promise<void>;
  // /**
  //  * Restore an entity by id
  //  * @param id - Value for the entity id
  //  * @param options - Options for the operations
  //  * @returns A promise that will be resolve if the operation succeeded or will
  //  * be rejected if the entity was not found.
  //  */
  // restoreById(id: ID, options?: Options): Promise<void>;
  // /**
  //  * Check if an entity exists for the given id
  //  * @param id - Value for the entity id
  //  * @param options - Options for the operations
  //  * @returns Promise<true> if an entity exists for the id, otherwise
  //  * Promise<false>
  //  */
  // exists(id: ID, options?: Options): Promise<boolean>;
}
