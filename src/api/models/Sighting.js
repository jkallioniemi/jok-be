const { Model } = require('objection');

class Sighting extends Model {
  static get tableName() {
    return 'Sighting';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['speciesId', 'count'],

      properties: {
        id: { type: 'integer' },
        speciesId: { type: 'integer' },
        dateTime: {
          oneOf:
            [{ type: 'null' }, { type: 'string', format: 'date-time' }],
        },
        description: {
          oneOf:
            [{ type: 'null' }, { type: 'string', minLength: 1, maxLength: 255 }],
        },
        count: { type: 'integer', minimum: 1 },
      },
    };
  }

  static get relationMappings() {
    return {
      species: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Species`,
        join: {
          from: 'Sighting.speciesId',
          to: 'Species.id',
        },
      },
    };
  }
}

module.exports = Sighting;
