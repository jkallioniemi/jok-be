# jok-be [![Build Status](https://travis-ci.org/jkallioniemi/jok-be.svg?branch=master)](https://travis-ci.org/jkallioniemi/jok-be)

## Requirements

 - Boilerplate says [Node v7.6+](https://nodejs.org/en/download/current/), I used v8.9.4, YMMV
 - [Yarn](https://yarnpkg.com/en/docs/install)

## Disclaimer

This project was developed in Linux Mint 18.2 Sonya. No guarantees whatsoever that it works on any other platform.

The project uses [Daniel Sousa](https://github.com/danielfsousa)'s
[express-rest-es2017-boilerplate](https://github.com/danielfsousa/express-rest-es2017-boilerplate) as a template,
with most of the stuff I did not need stripped out.

## Getting Started

Install dependencies:

```bash
yarn
```

Install PostgreSQL on the computer, with PostGIS.
Everything here was developed with PostgreSQL version 9.6.7 and PostGIS version 2.4.3 r16312.

Set environment variables:

```bash
cp .env.example .env
```

Set up both server DB and test DB:
```bash
yarn setup
```
create-db uses the 'postgres' user by default. 
If you wish to specify another superuser for creating the database, you can edit the `package.json` file.
The same goes for changing the name of the created database.
Keep in mind that if you change the name of the DB, you should also change the name of the database in
your .env file.

If you only want to create the DB for the app, you can do so with `yarn create-db`.
You can also recreate the database at any time with `yarn recreate-db`.
It is also possible to delete the databases created by the setup command with `yarn cleanup`.

If you only want to create the DB for the tests, this can be achieved with `yarn test-setup`.
Likewise, you can get rid of the test DB with `yarn test-cleanup`.

## Running Locally

```bash
yarn dev
```

## Lint

```bash
# lint code with ESLint
yarn lint

# try to fix ESLint errors
yarn lint:fix

# lint and watch for changes
yarn lint:watch
```

## Test

```bash
# run all tests with Mocha
yarn test
```

## Documentation

Running `yarn docs` will have apidoc generate the documentation.
Open `index.html` in the **docs** directory to read it.

## License

[MIT License](LICENSE) - Boilerplate [Daniel Sousa](https://github.com/danielfsousa),
everything else [Juuso Kallioniemi](https://github.com/jkallioniemi)
