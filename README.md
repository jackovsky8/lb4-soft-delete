# lb4-soft-delete

Add Soft Delete Funcionality to your LB4 Repositories.

- [x] Default Repoistory
- [ ] TODO: Soft Deleted Relations

## Install

```
npm install --save lb4-soft-delete
```

## Add Soft Delete Column to your Model

```
import {property} from '@loopback/repository';
import {SoftDeleteEntity} from 'lb4-soft-delete'

Product extends SoftDeleteEntity {
  @property({
    type: number,
    id: true
  })
  id?: number
}
```

or if you wanna change the definition of the deletedAt property:
e.g. it should be null instead of undefined for not deleted entities.

```
import {Entity, property} from '@loopback/repository';
import {softDelete} from 'lb4-soft-delete';

Product extends Entity { // Not working like that
  @property({
    type: number,
    id: true
  })
  id?: number

  @softDeleteProperty({
    default: null,
  })
  deletedAt?: string | null;
}
```

# Add Soft Delete Methods to your Repository

```
import {Product, ProductRelations} from '../models';
import {DbDataSource} from '../datasources';
import {SoftDeleteCrudRepository} from 'lb4-soft-delete';
import {inject} from '@loopback/core';

export class ProductRepository extends SoftDeleteCrudRepository<Product, Product.prototype.id, ProductRelations>
{
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Product, dataSource);
  }
}
```

# API:

## SoftDeleteFilter

```
interface SoftDeleteFilter<T extends SoftDeleteEntity> extends Filter<T> {
  withDeleted?: boolean;
  onlyDeleted?: boolean;
}
```

- withDeleted includes soft deleted Entities
- onlyDeleted only shows soft deleted Entities
- onlyDeleted > withDeleted

## repository.save()

```
save(entity: T, options?: Options): Promise<T>;
```

- Safe only if not deleted already // TODO
- Create a new, is unchanged from DefaultCrudRepository

## repository.create()

```
create(entity: DataObject<T>, options?: Options): Promise<T>;
```

- unchanged from DefaultCrudRepository

## repository.createAll()

```
createAll(entities: DataObject<T>[], options?: Options): Promise<T[]>;
```

- unchanged from DefaultCrudRepository

## repository.find()

```
find(filter?: SoftDeleteFilter<T>, options?: Options): Promise<(T & Relations)[]>;
```

- does not find soft deleted Entities
- filter includes withDeleted, onlyDeleted to show soft deleted Entities again

## repository.findOne()

```
findOne(filter?: SoftDeleteFilter<T>, options?: Options): Promise<(T & Relations) | null>;
```

- does not find soft deleted Entities
- filter includes withDeleted, onlyDeleted to show soft deleted Entities again

## repository.findById()

```
findById(id: ID, filter?: SoftDeleteFilter<T>, options?: Options): Promise<T & Relations>;
```

- does not find soft deleted Entities
- filter includes withDeleted, onlyDeleted to show soft deleted Entities again
- throws when soft delete state does not fit filter options
- throws when not found

## repository.update()

```
update (entity: T, options?: Options): Promise<void>;
```

- update entity
- throws if entity is soft deleted already // TODO TEST
- throws if entity is not found

## repository.delete()

```
delete(entity: T, options?: Options): Promise<void>;
```

- soft delete an entity
- throws when already soft deleted
- throws when not found

## repository.deleteHard()

```
deleteHard(entity: T, options?: Options): Promise<void>;
```

- soft delete an entity
- throws when already soft deleted
- throws when not found

## repository.restore()

```
restore(entity: T, options?: Options): Promise<void>;
```

- restore a soft deleted entity
- sets the deletedAt column to the default value of the property definition
- throws when not soft deleted
- throws when not found

## repository.updateAll()

```
updateAll(data: DataObject<T>, where?: Where<T>, options?: Options): Promise<Count>;
```

- update entities (only not soft deleted)

## repository.updateById()

```
updateById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
```

- update entity
- throws if entity is soft deleted already
- throws if entity is not found

## repository.replaceById()

```
replaceById(id: ID, data: DataObject<T>, options?: Options): Promise<void>;
```

- replace entity
- throws if entity is soft deleted already
- throws if entity is not found

## repository.deleteAll()

```
deleteAll(where?: Where<T>, options?: Options): Promise<Count>;
```

- soft delete entities

## repository.deleteAllHard()

```
deleteHardAll(where?: Where<T>, options?: Options): Promise<Count>;
```

- delete already soft deleted entities

## repository.restoreAll()

```
restoreAll(where?: Where<T>, options?: Options): Promise<Count>;
```

- restore soft deleted entities

## repository.deleteById()

```
deleteById(id: ID, options?: Options): Promise<void>;
```

- soft delete an entity
- throws when already soft deleted
- throws when not found

## repository.deleteHardById()

```
deleteHardById(id: ID, options?: Options): Promise<void>;
```

- delete an entity
- throws when not soft deleted
- throws when not found

## repository.restoreById()

```
restoreById(id: ID, options?: Options): Promise<void>;
```

- restore a soft deleted entity
- sets the deletedAt column to the default value of the property definition
- throws when not soft deleted
- throws when not found

## repository.count()

```
count(where?: Where<T>, options?: Options): Promise<Count>;
```

- counts only the not deleted entities

## repository.countWithDeleted()

```
countWithDeleted(where?: Where<T>, options?: Options): Promise<Count>;
```

- counts all entities

## repository.countOnlyDeleted()

```
countOnlyDeleted(where?: Where<T>, options?: Options): Promise<Count>;
```

- counts only the deleted entities

## repository.exists()

```
exists(id: ID, options?: Options): Promise<boolean>;
```

- unchanged from DefaultCrudRepository

[![LoopBack](<https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)

# https://help.github.com/en/articles/basic-writing-and-formatting-syntax
