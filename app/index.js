import http from 'http';
import url from 'url';

// Define the port to listen on

const port = parseInt(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const queryParams = parsedUrl.query;
    // Check the URL path
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World!\n');
    } 
    else if (parsedUrl.pathname === '/getweather') {
      const location = queryParams.location;
      let temp, conditions;
      
      if (location == "New Orleans") {
          temp = 99;
          conditions = "hot and humid";
      } else if (location == "Seattle") {
          temp = 40;
          conditions = "rainy and overcast";
      } else {
          res.status(400).send("there is no data for the requested location");
      }

      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write(JSON.stringify({weather: temp,
        location: location,
        conditions: conditions}));
      res.end()
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found\n');
    }
});

server.listen(port, () => {
    console.log('Server running on port '+port);
});