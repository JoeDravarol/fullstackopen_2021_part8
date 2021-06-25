import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import Select from 'react-select'

import { EDIT_AUTHOR } from '../queries'

const BirthForm = ({ authors }) => {
  const [selectedName, setSelectedName] = useState(null)
  const [born, setBorn] = useState('')

  const [editAuthor] = useMutation(EDIT_AUTHOR)

  const submit = (event) => {
    event.preventDefault()

    editAuthor({
      variables: {
        name: selectedName.value,
        setBornTo: Number(born)
      }
    })
  
    setBorn('')
  }

  const options = authors.map(author => 
    ({ value: author.name, label: author.name })
  )

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <Select
          value={selectedName}
          onChange={setSelectedName}
          options={options} 
        />
        <div>
          born
          <input value={born} onChange={({ target }) => setBorn(target.value)} />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  )
}

export default BirthForm
