exports.seed = knex =>
  // Deletes ALL existing entries
  knex('Species').del()
    .then(() =>
      // Inserts seed entries
      knex('Species').insert([
        { id: 1, name: 'mallard' },
        { id: 2, name: 'redhead' },
        { id: 3, name: 'gadwall' },
        { id: 4, name: 'canvasback' },
        { id: 5, name: 'lesser scaup' },
      ]));
