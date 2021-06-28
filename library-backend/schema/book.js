const { gql, AuthenticationError, PubSub, UserInputError } = require('apollo-server')
const Book = require('../models/book')
const Author = require('../models/author')

const pubsub = new PubSub()

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  extend type Query {
    bookCount: Int!
    allBooks(author: String, genre: String): [Book!]!
  }

  extend type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
  }

  type Subscription {
    bookAdded: Book!
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.genre) {
        return Book.find({ genres: { $in: args.genre }})
      } else if (args.author) {
        const author = await Author.findOne({ name: args.author })
        return author ? Book.find({ author: author._id }) : []
      }
      
      return Book.find({})
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const book = new Book({ ...args })

      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      const author = await Author.findOne({ name: args.author })

      try {
        if (!author) {
          const newAuthor = new Author({ name: args.author, books: [book._id] })
          console.log(newAuthor)
          book.author = newAuthor._id
          await newAuthor.save()
        } else {
          author.books = author.books.concat(book._id)
          book.author = author._id
          await author.save()
        }
  
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
}

module.exports = { typeDefs, resolvers }