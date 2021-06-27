import React from 'react'

const GenreButtons = ({ genres, getByGenre, getAllGenre }) => {
  return (
    <div>
      {genres.map(genre =>
        <button key={genre} onClick={() => getByGenre(genre)}>
          {genre}
        </button>
      )}
      <button onClick={getAllGenre}>all genres</button>
    </div>
  )
}

export default GenreButtons
