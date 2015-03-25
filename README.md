# Panatrans web

Webapp client/editor of the panatrans project. 

This webapp is pure HTML/Javascript and it requires a server running the [panatrans-api](https://github.com/merlos/panatrans-api) to be fully functional.

## About

Panatrans is a collaborative project to allow the users of the panamenian public transport to create a dataset with the information of the stops and routes available in the City of Panama (which is currently inexistent).

This project is based in the premise that open software and open data are the key of innovation.

Collaborative user generated content is another key concept of the project, and in that sense, the webap provides universal read and write access to content.

Related Projects that may interest you:

* __[panatrans-dataset](https://github.com/merlos/panatrans-dataset)__: dataset to be used with this API.
* __[panatrans-api](https://github.com/merlos/panatrans-api)__: API/backend that is used by this webapp.


## Development

To preview the app run:

```
$ grunt serve
```

Open your browser at `http://localhost:9000/`.

## Configuration

You can modify the configuration by editing the file `app/scripts/config.js`. This file contains all the information.

## Building distribution

To create the distribution version (minified, cdn, etc...) run:

``` 
$ grunt --force
```

To preview if the distribution version works fine:

```
$ cd dist
$ python -m SimpleHTTPServer
```
Open a browser at `http://localhost:8000/`.


## Testing

Running `grunt test` will run the unit tests with karma.

NOTE: tests have not been implemented.

--
This project was generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.11.1.


# License

panatrans-web. Copyright (C) 2015 Juan M. Merlos (@merlos)

This program is free software: you can redistribute it and/or modify it under the terms of the __GNU General Public License__ as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/.
