exports.seed = knex =>
  // Deletes ALL existing entries
  knex('Sighting').del()
    .then(() =>
      // Inserts seed entries
      knex('Sighting').insert([
        {
          speciesId: 3,
          description: 'All your ducks are belong to us',
          dateTime: '2016-10-01T01:01:00Z',
          count: 1,
        },
        {
          speciesId: 5,
          description: 'This is awesome',
          dateTime: '2016-12-13T12:05:00Z',
          count: 5,
        },
        {
          speciesId: 4,
          description: '...',
          dateTime: '2016-11-30T23:59:00Z',
          count: 2,
        },
        {
          speciesId: 1,
          description: 'Getting tired',
          dateTime: '2016-11-29T00:00:00Z',
          count: 18,
        },
        {
          speciesId: 2,
          description: 'I think this one is called Alfred J.',
          dateTime: '2016-11-29T10:00:01Z',
          count: 1,
        },
        {
          speciesId: 2,
          description: 'If it looks like a duck, swims like a duck, and quacks like a duck, then it probably is a duck.',
          dateTime: '2016-12-01T13:59:00Z',
          count: 1,
        },
        {
          speciesId: 1,
          description: 'Too many ducks to be counted',
          dateTime: '2016-12-12T12:12:12Z',
          count: 100,
        },
        {
          speciesId: 4,
          description: 'KWAAK!!!1',
          dateTime: '2016-12-11T01:01:00Z',
          count: 5,
        },
      ]));
