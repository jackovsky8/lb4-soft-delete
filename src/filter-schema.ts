import {
  Model,
  SchemaObject,
  getFilterJsonSchemaFor,
  jsonToSchemaObject,
  JsonSchema,
} from '@loopback/rest';

/**
 * Build an OpenAPI schema describing the format of the "filter" object
 * used to query model instances.
 *
 * Note we don't take the model properties into account yet and return
 * a generic json schema allowing any "where" condition.
 *
 * @param modelCtor - The model constructor to build the filter schema for.
 */
export function getSoftDeleteFilterSchemaFor(
  modelCtor: typeof Model,
): SchemaObject {
  const jsonSchema: JsonSchema = getFilterJsonSchemaFor(modelCtor);
  let schema: SchemaObject = jsonToSchemaObject(jsonSchema);

  schema = {
    ...schema,
    properties: {
      ...schema.properties,
      withDeleted: {type: 'boolean'},
      onlyDeleted: {type: 'boolean'},
    },
  };

  return schema;
}
