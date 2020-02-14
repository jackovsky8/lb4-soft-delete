import {expect} from '@loopback/testlab';
import {
  EntityNotFoundError,
  juggler,
  model,
  property,
} from '@loopback/repository';
import {SoftDeleteCrudRepository} from '../../../repositories';
import {SoftDeleteEntity} from '../../../model';

describe('SoftDeleteCrudRepository', () => {
  let ds: juggler.DataSource;

  // Define a Item Model with Soft Deletion
  @model({name: 'Item'})
  class Item extends SoftDeleteEntity {
    @property({
      type: 'string',
      required: true,
      name: 'title',
    })
    title?: string;

    @property({
      type: 'string',
      name: 'description',
    })
    description?: string;

    @property({
      type: 'number',
      id: true,
      name: 'id',
    })
    id: number;

    constructor(data: Partial<Item>) {
      super(data);
    }
  }

  beforeEach(() => {
    ds = new juggler.DataSource({
      name: 'db',
      connector: 'memory',
    });
  });

  describe('save', () => {
    it('implements Repository.save()', async () => {
      const repo = new SoftDeleteCrudRepository<Item, typeof Item.prototype.id>(
        Item,
        ds,
      );
      let item = new Item({
        title: 't1',
        description: 'd1',
      });
      item = await repo.save(item);
      expect(item.id).to.eql(1);
    });

    it('implements Repository.save() - replace existing one', async () => {
      const repo = new SoftDeleteCrudRepository<Item, typeof Item.prototype.id>(
        Item,
        ds,
      );
      let item = new Item({
        title: 't1',
        description: 'd1',
      });
      item = await repo.save(item);
      expect(item.id).to.eql(1);
      item.title = 't2';
      await repo.save(item);
      item = await repo.findById(1);
      expect(item.title).to.eql('t2');
      expect(item.description).to.eql('d1');
    });

    it('throws when try to replace deleted', async () => {
      const repo = new SoftDeleteCrudRepository<Item, typeof Item.prototype.id>(
        Item,
        ds,
      );
      let item = new Item({
        title: 't1',
        description: 'd1',
      });
      item = await repo.save(item);
      expect(item.id).to.eql(1);
      item.title = 't2';
      await repo.deleteById(1);
      await expect(repo.save(item)).to.be.rejected();
    });
  });

  describe('create', () => {
    it('implements Repository.create()', async () => {
      const repo = new SoftDeleteCrudRepository<Item, typeof Item.prototype.id>(
        Item,
        ds,
      );
      const item = await repo.create({title: 't3', description: 'c3'});
      const result = await repo.findById(item.id);
      expect(result.toJSON()).to.eql(item.toJSON());
    });

    it('implements Repository.createAll()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const items = await repo.createAll([
        {title: 't3', description: 'c3'},
        {title: 't4', description: 'c4'},
      ]);
      expect(items.length).to.eql(2);
      const result = await repo.find();
      expect(items.length).to.eql(2);
      const mapped = result.map(n => n.title + ':' + n.description);
      expect(mapped).to.deepEqual(['t3:c3', 't4:c4']);
    });
  });

  describe('find', () => {
    it('implements Repository.find()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't2', description: 'c2'},
      ]);
      const items = await repo.find({where: {title: 't1'}});
      expect(items.length).to.eql(1);
    });

    it('implements Repository.find() with deleted item', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't2', description: 'c2'},
      ]);
      const count = await repo.deleteAll({title: 't1'});
      expect(count.count).to.eql(1);
      let items = await repo.find({where: {title: 't1'}});
      expect(items.length).to.eql(0);
      items = await repo.find();
      expect(items.length).to.eql(1);
    });

    it('implements Repository.find() with deleted item (only deleted)', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't2', description: 'c2'},
      ]);
      const count = await repo.deleteAll({title: 't1'});
      expect(count.count).to.eql(1);
      let items = await repo.find({where: {title: 't1'}, onlyDeleted: true});
      expect(items.length).to.eql(1);
      items = await repo.find({where: {title: 't2'}, onlyDeleted: true});
      expect(items.length).to.eql(0);
      items = await repo.find({onlyDeleted: true});
      expect(items.length).to.eql(1);
    });

    it('implements Repository.find() with deleted item (with deleted)', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't2', description: 'c2'},
      ]);
      const count = await repo.deleteAll({title: 't1'});
      expect(count.count).to.eql(1);
      let items = await repo.find({where: {title: 't1'}, withDeleted: true});
      expect(items.length).to.eql(1);
      items = await repo.find({where: {title: 't2'}, withDeleted: true});
      expect(items.length).to.eql(1);
      items = await repo.find({withDeleted: true});
      expect(items.length).to.eql(2);
    });
  });

  describe('findOne', () => {
    it('implements Repository.findOne()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't1', description: 'c2'},
      ]);
      const item = await repo.findOne({
        where: {title: 't1'},
        order: ['description DESC'],
      });
      expect(item).to.not.be.null();
      expect(item && item.title).to.eql('t1');
      expect(item && item.description).to.eql('c2');
    });

    it('implements Repository.findOne() with deleted item (only deleted)', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't1', description: 'c2'},
      ]);
      let item = await repo.findOne({
        where: {title: 't1'},
        onlyDeleted: true,
        order: ['description DESC'],
      });
      expect(item).to.be.null();
      const count = await repo.deleteAll({description: 'c1'});
      expect(count.count).to.eql(1);
      item = await repo.findOne({
        where: {title: 't1'},
        onlyDeleted: true,
        order: ['description DESC'],
      });
      expect(item).to.not.be.null();
      expect(item && item.title).to.eql('t1');
      expect(item && item.description).to.eql('c1');
    });

    it('implements Repository.findOne() with deleted item (with deleted)', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't1', description: 'c2'},
      ]);
      let item = await repo.findOne({
        where: {title: 't1'},
        withDeleted: true,
        order: ['description DESC'],
      });
      expect(item).to.not.be.null();
      expect(item && item.title).to.eql('t1');
      expect(item && item.description).to.eql('c2');
      const count = await repo.deleteAll({description: 'c2'});
      expect(count.count).to.eql(1);
      item = await repo.findOne({
        where: {title: 't1'},
        withDeleted: true,
        order: ['description DESC'],
      });
      expect(item).to.not.be.null();
      expect(item && item.title).to.eql('t1');
      expect(item && item.description).to.eql('c2');
    });

    it('returns null if Repository.findOne() does not return a value', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.createAll([
        {title: 't1', description: 'c1'},
        {title: 't1', description: 'c2'},
      ]);
      const item = await repo.findOne({
        where: {title: 't5'},
        order: ['description DESC'],
      });
      expect(item).to.be.null();
    });
  });

  describe('findById', () => {
    it('returns the correct instance', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({
        title: 'a-title',
        description: 'a-description',
      });
      const result = await repo.findById(item.id);
      expect(result && result.toJSON()).to.eql(item.toJSON());
    });

    it('throws when soft deleted - no Filter', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({
        title: 'A1',
        description: 'B1',
      });
      await repo.delete(item);
      await expect(repo.findById(item.id)).to.be.rejectedWith({
        code: 'ENTITY_NOT_FOUND',
        message: 'Entity not found: Item with id ' + item.id,
      });
    });

    it('throws not when soft deleted . Filter withDeleted', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({
        title: 'A1',
        description: 'B1',
      });
      await repo.delete(item);
      const result = await repo.findById(item.id, {withDeleted: true});
      expect(result.title).to.eql('A1');
      expect(result.description).to.eql('B1');
    });

    it('throws not when soft deleted - Filter onlyDeleted', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({
        title: 'A1',
        description: 'B1',
      });
      await repo.delete(item);
      const result = await repo.findById(item.id, {onlyDeleted: true});
      expect(result.title).to.eql('A1');
      expect(result.description).to.eql('B1');
    });

    it('throws when not soft deleted - Filter onlyDeleted', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({
        title: 'A1',
        description: 'B1',
      });
      await expect(
        repo.findById(item.id, {onlyDeleted: true}),
      ).to.be.rejectedWith({
        code: 'ENTITY_NOT_FOUND',
        message: 'Entity not found: Item with id ' + item.id,
      });
    });

    it('throws not when not soft deleted - Filter withDeleted', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({
        title: 'A1',
        description: 'B1',
      });
      const result = await repo.findById(item.id, {withDeleted: true});
      expect(result.title).to.eql('A1');
      expect(result.description).to.eql('B1');
    });

    it('throws when the instance does not exist', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await expect(repo.findById(999999)).to.be.rejectedWith({
        code: 'ENTITY_NOT_FOUND',
        message: 'Entity not found: Item with id 999999',
      });
    });
  });

  describe('soft and hard deletes', () => {
    it('implements Repository.delete()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      await repo.delete(item);

      const found = await repo.find({where: {id: item.id}});
      expect(found).to.be.empty();
    });

    it('implements Repository.deleteHard() - soft deleted first - gets deleted', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      let item: Item = await repo.create({title: 't3', description: 'c3'});

      await repo.delete(item);
      item = (await repo.find({
        where: {id: item.id},
        withDeleted: true,
      }))[0];

      await repo.deleteHard(item);

      let found = await repo.find({where: {id: item.id}});
      expect(found).to.be.empty();
      found = await repo.find({where: {id: item.id}, withDeleted: true});
      expect(found).to.be.empty();
    });

    it('implements Repository.deleteHard() - not soft deleted first - throws Error', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      await expect(repo.deleteHard(item)).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });

    it('implements Repository.deleteById()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      await repo.deleteById(item.id);

      const found = await repo.find({where: {id: item.id}});
      expect(found).to.be.empty();
    });

    it('implements Repository.deleteHardById() - soft deleted first - gets deleted', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      await expect(repo.deleteHardById(item.id)).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });

    it('implements Repository.deleteHardById() - not soft deleted first - throws Error', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      await repo.deleteById(item.id);

      const found = await repo.find({where: {id: item.id}});
      expect(found).to.be.empty();
    });

    it('throws EntityNotFoundError when deleting an unknown id', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await expect(repo.deleteById(99999)).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });

    it('implements Repository.deleteAll()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      const result = await repo.deleteAll({title: 't3'});
      expect(result.count).to.eql(1);
    });
  });

  describe('restore', () => {
    it('implements Repository.restore()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      let item = await repo.create({title: 't3', description: 'c3'});
      await repo.delete(item);
      item = await repo.findById(item.id, {onlyDeleted: true});
      await repo.restore(item);
      item = await repo.findById(item.id);
      expect(item.title).to.eql('t3');
      expect(item.description).to.eql('c3');
    });

    it('throws when try to restore not deleted one', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});
      await expect(repo.restore(item)).to.be.rejectedWith(EntityNotFoundError);
    });

    it('implements Repository.restoreById()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      let item = await repo.create({title: 't3', description: 'c3'});
      await repo.deleteById(item.id);
      item = await repo.findById(item.id, {onlyDeleted: true});
      await repo.restoreById(item.id);
      item = await repo.findById(item.id);
      expect(item.title).to.eql('t3');
      expect(item.description).to.eql('c3');
    });

    it('throws when try to restore not deleted one by id', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});
      await expect(repo.restoreById(item)).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });
  });

  describe('updates', () => {
    it('implements Repository.updateById()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      const id = item.id;
      const delta = {description: 'c4'};
      await repo.updateById(id, delta);

      const updated = await repo.findById(id);
      expect(updated.toJSON()).to.eql(Object.assign(item.toJSON(), delta));
    });

    it('throws EntityNotFound error when updating an soft deleted id', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});

      await repo.delete(item);

      await expect(repo.updateById(item.id, {title: 't4'})).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });

    it('throws EntityNotFound error when updating an unknown id', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await expect(repo.updateById(9999, {title: 't4'})).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });

    it('implements Repository.updateAll()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      const result = await repo.updateAll({description: 'c5'}, {});
      expect(result.count).to.eql(2);
      const items = await repo.find({where: {title: 't3'}});
      expect(items[0].description).to.eql('c5');
    });

    it('implements Repository.updateAll() without a where object', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      const result = await repo.updateAll({description: 'c5'});
      expect(result.count).to.eql(2);
      const items = await repo.find();
      const titles = items.map(n => `${n.title}:${n.description}`);
      expect(titles).to.deepEqual(['t3:c5', 't4:c5']);
    });

    it('implements Repository.updateAll() without a where object - only not soft deleted ones', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      await repo.deleteAll({title: 't4'});
      const result = await repo.updateAll({description: 'c5'});
      expect(result.count).to.eql(1);
      let items = await repo.find();
      expect(items[0].title).to.eql('t3');
      expect(items[0].description).to.eql('c5');
      items = await repo.find({onlyDeleted: true});
      expect(items[0].title).to.eql('t4');
      expect(items[0].description).to.eql('c4');
    });
  });

  describe('replace', () => {
    it('implements Repository.replaceById()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});
      await repo.replaceById(item.id, {title: 't4', description: undefined});
      const result = await repo.findById(item.id);
      expect(result.toJSON()).to.eql({
        id: item.id,
        title: 't4',
        description: undefined,
        deletedAt: undefined,
      });
    });

    it('throws EntityNotFound error when replacing an deleted id', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});
      await repo.delete(item);
      await expect(repo.replaceById(item.id, {title: 't4'})).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });

    it('throws EntityNotFound error when replacing an unknown id', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await expect(repo.replaceById(9999, {title: 't4'})).to.be.rejectedWith(
        EntityNotFoundError,
      );
    });
  });

  describe('count', () => {
    it('implements Repository.count()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      const result = await repo.count();
      expect(result.count).to.eql(2);
    });

    it('implements Repository.count() with a deleted one', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      await repo.deleteAll({title: 't4'});
      const result = await repo.count();
      expect(result.count).to.eql(1);
    });

    it('implements Repository.countWithDeleted()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      await repo.create({title: 't5', description: 'c5'});
      await repo.deleteAll({title: 't4'});
      const result = await repo.countWithDeleted();
      expect(result.count).to.eql(3);
    });

    it('implements Repository.countOnlyDeleted()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      await repo.create({title: 't3', description: 'c3'});
      await repo.create({title: 't4', description: 'c4'});
      await repo.create({title: 't5', description: 'c5'});
      await repo.deleteAll({title: 't4'});
      const result = await repo.countOnlyDeleted();
      expect(result.count).to.eql(1);
    });
  });

  describe('exist', () => {
    it('implements Repository.exists()', async () => {
      const repo = new SoftDeleteCrudRepository(Item, ds);
      const item = await repo.create({title: 't3', description: 'c3'});
      const ok = await repo.exists(item.id);
      expect(ok).to.be.true();
    });
  });
});
