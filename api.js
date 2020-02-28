
import axios from 'axios'

export const store = (data) => {
    axios.post('http://localhost:3001/store', data)
    .then( res => console.log(res.status))
    .catch( err => console.log(err))
}

export const all = () => {
    axios.get('http://localhost:3001/', data)
    .then( res => console.log(res.status))
    .catch( err => console.log(err))
}

export const bounds = (params) => {
    axios.get(`http://localhost:3001/within/${params.latitude}/${params.longitude}/${params.distance}`)
    .then( res => console.log(res.status))
    .catch( err => console.log(err))
}

