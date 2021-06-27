import React, { useState, useEffect } from 'react'
import { useQuery, useLazyQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'

const Recommend = ({ show }) => {
  const user = useQuery(ME)
  const [allBooks, result] = useLazyQuery(ALL_BOOKS, {
    fetchPolicy: 'cache-and-network'
  })
  const [books, setBooks] = useState([])

  // User.data.me is default to null even after login
  // so refetch user data when the view is being displayed
  useEffect(() => {
    if (show) {
      user.refetch()
    }
  }, [show, user])

  useEffect(() => {
    if (user.data && user.data.me) {
      allBooks({ variables: { genre: user.data.me.favoriteGenre } })
    }
  }, [user, allBooks])

  useEffect(() => {
    if (result.data) {
      setBooks(result.data.allBooks)
    }
  }, [result.data]) 

  if (!show) return null

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre {user?.data?.me?.favoriteGenre}</p>

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
    </div>
  )
}

export default Recommend