import {AnyObject} from 'loopback-datasource-juggler';
import {Filter} from '@loopback/repository';

/**
 * Query filter object
 */
export interface SoftDeleteFilter<MT extends object = AnyObject>
  extends Filter<MT> {
  /**
   * Adding soft deleted Entities
   */
  withDeleted?: boolean;
  /**
   * Only show soft deleted Entities
   */
  onlyDeleted?: boolean;
}
