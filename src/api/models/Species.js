const { Model } = require('objection');

class Species extends Model {
  static get tableName() {
    return 'Species';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
      },
    };
  }

  static get relationMappings() {
    return {
      sightings: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Sighting`,
        join: {
          from: 'Species.id',
          to: 'Sighting.speciesId',
        },
      },
    };
  }
}

module.exports = Species;
