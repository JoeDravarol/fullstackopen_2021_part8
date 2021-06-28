const { merge } = require('lodash')
const { makeExecutableSchema } = require('apollo-server');
const jwt = require('jsonwebtoken')
const config = require('../utils/config')

const User = require('../models/user')

const {
  typeDefs: Author,
  resolvers: authorResolvers
} = require('./author')
const {
  typeDefs: Book,
  resolvers: bookResolvers
} = require('./book')
const {
  typeDefs: UserTypeDefs,
  resolvers: userResolvers
} = require('./user')

const Query = `
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`
const resolvers = {}

const schema = makeExecutableSchema({
  typeDefs: [ Query, Author, Book, UserTypeDefs ],
  resolvers: merge(resolvers, authorResolvers, bookResolvers, userResolvers),
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), config.JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})

module.exports = schema