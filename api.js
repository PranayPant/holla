
import axios from 'axios'

export const store = (data) => {
    console.log('Performing post call to store data')
    axios.post('http://172.17.49.17:3001/store', data)
    .then( res => console.log(res.status))
    .catch( err => console.log(err))
}

export const all = () => {
    axios.get('http://172.17.49.17:3001/')
    .then( res => console.log(res.status))
    .catch( err => console.log(err))
}

export const bounds = (params) => {
    axios.get(`http://172.17.49.17:3001/within/${params.latitude}/${params.longitude}/${params.distance}`)
    .then( res => console.log(res.status))
    .catch( err => console.log(err))
}

