import React, { useState, useEffect } from 'react'
import { useLazyQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'
import GenreButtons from './GenreButtons'

const Books = (props) => {
  const [allBooks, result] = useLazyQuery(ALL_BOOKS)
  const [books, setBooks] = useState([])

  useEffect(() => {
    allBooks()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (result.data) {
      setBooks(result.data.allBooks)
    }
  }, [result.data]) 

  if (!props.show) {
    return null
  }

  const genres = [...new Set( books.map(book => book.genres).flat() )]

  const booksByGenre = (genre) => {
    allBooks({ variables: { genre } })
  }

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      <GenreButtons genres={genres} getByGenre={booksByGenre} getAllGenre={allBooks} />
    </div>
  )
}

export default Books