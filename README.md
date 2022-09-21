# Delaunay triangulation

> Interactive implementation of the Delaunay triangulation.

## Table of Contents
* [General Info](#general-information)
* [Technologies Used](#technologies-used)
* [Features](#features)
* [Screenshots](#screenshots)
* [Setup](#setup)
* [Usage](#usage)
* [Project Status](#project-status)
* [Room for Improvement](#room-for-improvement)
* [Acknowledgements](#acknowledgements)
* [Contact](#contact)
<!-- * [License](#license) -->


## General Information
- This project aims to triangulate any given set of points using the Delaunay triangulation.
- The Delaunay triangulation is used for modeling terrains with a nice set of triangles to use as polygons in the models. It avoids narrow triangles.
- This implementation uses a doubly connected edge list (DCEL).


## Technologies Used
- JavaScript
- HTML
- CSS

## Features
List the ready features here:
- You can zoom in and out and move around to see the triangulation in greater detail!
- After triangulating the set you


## Screenshots
![Example screenshot](./img/screenshot.png)

## Setup
You only need to clone the repo and follow the instructions below!

## Usage
To provide a new set of points:
- It has to be written in the same JSON format as `toy_example.json.js` for example.
- You have to change the name of the file read by the `main.html` by your file in line 13:
`<script type="text/javascript" src="YOUR_FILE.json.js"></script>`
- Then open `main.html` and click on the "triangulate" button for the Delaunay triangulation to compute and show up.
- Click on "prune boundaries" to remove the extra boundaries added to the set to perform the triangulation.

## Project Status
Project is: _complete_

## Acknowledgements
- This project was created for my Computational Geometry class.

## Contact
Created by [@theofuhrmann](https://theofuhrmann.github.io/) - feel free to contact me!

