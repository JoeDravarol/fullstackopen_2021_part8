require('dotenv').config()
const { ApolloServer, gql, UserInputError, AuthenticationError, PubSub } = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

console.log(process.env.MONGODB_URI)

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

mongoose.set('debug', true);

const pubsub = new PubSub()

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`

const JWT_SECRET = process.env.JWT_SECRET

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: async () => {
      return Author.collection.countDocuments()
    },
    allBooks: async (root, args) => {
      if (args.genre) {
        return Book.find({ genres: { $in: args.genre }})
      } else if (args.author) {
        const author = await Author.findOne({ name: args.author })
        return author ? Book.find({ author: author._id }) : []
      }
      
      return Book.find({})
    },
    allAuthors: async () => {
      const authors = await Author.find({}).lean()
      const authorsWithBookCount = authors.map(author => {
        const bookCount = author.books.length
        return { ...author, id: author._id, bookCount }
      })
      console.log('author')
      console.log(authors)
      console.log('author bookCount')
      console.log(authorsWithBookCount)
      return authorsWithBookCount
    },
    me: (root, args, context) => {
      return context.currentUser
    }
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
    createUser: (root, args) => {
      const user = new User({ ...args })

      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if ( !user || args.password !== 'password' ) {
        throw new UserInputError('incorrect credentials')
      }

      const userForToken = {
        username: user.username,
        favoriteGenre: user.favoriteGenre,
        id: user._id
      }

      return { value: jwt.sign(userForToken, JWT_SECRET )}
    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})