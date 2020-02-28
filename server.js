
const express    = require('express')
const bodyParser = require('body-parser')
const cors       =  require('cors')

const app = express()
const port = 3001

const GeoPoint = require('geopoint')

app.listen(port, () => console.log(`Holla middleware listening on port ${port}!`))

//
// Set up in-memory db map of location:user
//
let coordsMap = new Map();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/store', (req, res) => {

    console.log(req.body.location)
    console.log(req.body.user)

    coordsMap.set(req.body.location, req.body.user)

    res.sendStatus(200);
});

app.get('/', (req, res) => {
    let buffer = []
    coordsMap.forEach( (value, key, map) => {
        buffer.push( `${JSON.stringify(key)}: ${JSON.stringify(value)}` )
    });
    let entries_str = buffer.join("\n");
    res.status( 200 );
    res.send( entries_str );
});

app.get('/within/:latitude/:longitude/:distance', (req, res) => {

    let latitude  = parseInt(req.params.latitude)
    let longitude = parseInt(req.params.longitude)
    let distance  = parseInt(req.params.distance)

    let currPos = new GeoPoint( latitude, longitude)
    let bounds = currPos.boundingCoordinates( distance )
    let resStr = `{sw:[${bounds[0].latitude()}, ${bounds[0].longitude()}], ne:[${bounds[1].latitude()}, ${bounds[1].longitude()}]}`

    res.status(200)
    res.send(resStr)
})

module.exports = app;

