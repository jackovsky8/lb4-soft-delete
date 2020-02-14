import {PropertyDefinition, MODEL_PROPERTIES_KEY} from '@loopback/repository';
import {PropertyDecoratorFactory} from '@loopback/core';

/**
 * Add deleted column to Model - date column
 * @param definition PropertyDefinition, type gets overwritten with 'date', required gets overwritten with false, set default to null if you wanna be deletedAt null insted of undefined for not deleted Entities.
 * @example
 *
 *  @softDeleteProperty({
 *    default: null
 *  })
 *  deletedAt?: string | null
 *
 */
export function softDeleteProperty(definition?: Partial<PropertyDefinition>) {
  definition = definition || {};
  const standardDefinition: Partial<PropertyDefinition> = {
    description: 'The date of deletion.',
    default: undefined,
  };

  const fixedDefinition: Partial<PropertyDefinition> = {
    type: 'date',
    required: false,
  };

  return PropertyDecoratorFactory.createDecorator(
    MODEL_PROPERTIES_KEY,
    Object.assign({}, standardDefinition, definition, fixedDefinition),
    {decoratorName: '@softDelete'},
  );
}
