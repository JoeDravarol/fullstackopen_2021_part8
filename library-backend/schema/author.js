const { gql, AuthenticationError, UserInputError } = require('apollo-server')
const Author = require('../models/author')

const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  extend type Query {
    authorCount: Int!
    allAuthors: [Author!]!
  }

  extend type Mutation {
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

const resolvers = {
  Query: {
    authorCount: async () => {
      return Author.collection.countDocuments()
    },
    allAuthors: async () => {
      const authors = await Author.find({}).lean()
      const authorsWithBookCount = authors.map(author => {
        const bookCount = author.books.length
        return { ...author, id: author._id, bookCount }
      })

      return authorsWithBookCount
    },
  },
  Mutation: {
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      const author = await Author.findOne({ name: args.name })
      author.born = args.setBornTo

      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return author
    },
  }
}

module.exports = { typeDefs, resolvers }