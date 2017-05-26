const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

// this lets us use *should* style syntax in our tests
// so we can do things like `(1 + 1).should.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should();

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('Recipes', function() {
    before(function() {
        return runServer();
    });

    after(function() {
        return closeServer();
    });
    it('should list recipes on GET', function() {
        return chai.request(app)
      .get('/recipes')
      .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.length.should.be.at.least(1);
        // each item should be an object with key/value pairs
        // for `id`, `name` and `checked`.
          const expectedKeys = ['id', 'name', 'ingredients'];
          res.body.forEach(function(item) {
              item.should.be.a('object');
              item.should.include.keys(expectedKeys);
          });
      });
    });

    it('should add an item on POST', function() {
        const newItem = {name: 'borsh', ingredients: ['cabbage','beets']};
        return chai.request(app)
      .post('/recipes')
      .send(newItem)
      .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys('id', 'name', 'ingredients');
          res.body.id.should.not.be.null;
        // response should be deep equal to `newItem` from above if we assign
        // `id` to it from `res.body.id`
          res.body.should.deep.equal(Object.assign(newItem, {id: res.body.id}));
      });
    });

    it('should update items on PUT', function() {
    // we initialize our updateData here and then after the initial
    // request to the app, we update it with an `id` property so
    // we can make a second, PUT call to the app.
        const updateData = {
           name: 'steak',
           ingredients: ['sauce','meat']
       };

        return chai.request(app)
      // first have to get so we have an idea of object to update
      .get('/recipes')
      .then(function(res) {
          updateData.id = res.body[0].id;
        // this will return a promise whose value will be the response
        // object, which we can inspect in the next `then` back. Note
        // that we could have used a nested callback here instead of
        // returning a promise and chaining with `then`, but we find
        // this approach cleaner and easier to read and reason about.
          return chai.request(app)
          .put(`/recipes/${updateData.id}`)
          .send(updateData);
      })
      // prove that the PUT request has right status code
      // and returns updated item
      .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.deep.equal(updateData);
      });
    });

    it('should delete items on DELETE', function() {
        return chai.request(app)
      // first have to get so we have an `id` of item
      // to delete
      .get('/recipes')
      .then(function(res) {
          return chai.request(app)
          .delete(`/recipes/${res.body[0].id}`);
      })
      .then(function(res) {
          res.should.have.status(204);
      });
    });
});