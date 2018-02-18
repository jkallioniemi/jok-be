exports.seed = knex =>
  // Deletes ALL existing entries
  knex('Species').del()
    .then(() =>
      // Inserts seed entries
      knex('Species').insert([
        { name: 'mallard' },
        { name: 'redhead' },
        { name: 'gadwall' },
        { name: 'canvasback' },
        { name: 'lesser scaup' },
      ]));
