
import axios from 'axios'
import axiosRetry from 'axios-retry';
 
axiosRetry(axios, { retries: 3 });
axiosRetry(axios, { retryDelay: (retryCount) => {
    return retryCount * 1000;
}});

export const store = (data) => {
    console.log('Performing post call to store data')
    axios.post('https://tgfme3djga.execute-api.us-east-1.amazonaws.com/development/store', data)
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

