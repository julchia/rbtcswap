<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** github_username, repo_name, twitter_handle, email, project_title, project_description
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]


<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/Teks-Capital/rbtcswap">
    <img src="frontend/src/assets/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">rbtcSwap</h3>

  <p align="center">
    Web App to convert BTC<->RBTC
    <br />
    <a href="https://github.com/Teks-Capital/rbtcswap/issues">Report Bug</a>
    ·
    <a href="https://github.com/Teks-Capital/rbtcswap/issues">Request Feature</a>
  </p>
</p>
</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>


<!-- GETTING STARTED -->
## Getting Started

### Clone the project

```
git clone https://github.com/Teks-Capital/rbtcswap
```

### Prerequisites:

* NodeJS
* NPM
* MongoDB

## Installation

In your terminal run

* Run `cd backend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `node index.js`

Open another tab and run `node process/index.js` in order to run the update status process.

## Frontend

### For run VUEjs on devmode

In a new terminal tab run

* Run `cd frontend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `npm run serve`

### For production ready assets

In a new terminal tab run

* Run `cd frontend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `npm run build`

By default the frontend is served in `http://localhost:5556/`.


### Production PM2 setup

#### Backend server

In order to run backend server with pm2:

* `cd backend`
* `pm2 start "node index.js" --name "SOME_NAME"`

#### Oder update process

In order to run order-update process:

* `cd backend`
* `pm2 start "node process/index.js" --name "SOME_NAME"`

#### Useful commands

Some useful commands to interact with pm2:

* To view process list: `pm2 list`
* To monit process consumption: `pm2 monit`
* To stop/restart process: `pm2 stop/restart <id>`
* To view ALL logs: `pm2 logs`
* To view <id> process logs: `pm2 logs <id>`
* To flush log history: `pm2 flush`
* To save current process configuration and enable them on startup:

```
pm2 startup
pm2 save
```



<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/Teks-Capital/rbtcswap/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the CC BY-SA 4.0 License. See [LICENCE](https://creativecommons.org/licenses/by-sa/4.0/) for more information.


<!-- CONTACT -->
## Contact

Project Link: [https://github.com/Teks-Capital/rbtcswap](https://github.com/Teks-Capital/rbtcswap)


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/Teks-Capital/rbtcswap.svg?style=for-the-badge
[contributors-url]: https://github.com/Teks-Capital/rbtcswap/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Teks-Capital/rbtcswap.svg?style=for-the-badge
[forks-url]: https://github.com/Teks-Capital/rbtcswap/network/members
[stars-shield]: https://img.shields.io/github/stars/Teks-Capital/rbtcswap.svg?style=for-the-badge
[stars-url]: https://github.com/Teks-Capital/rbtcswap/stargazers
[issues-shield]: https://img.shields.io/github/issues/Teks-Capital/rbtcswap.svg?style=for-the-badge
[issues-url]: https://github.com/Teks-Capital/rbtcswap/issues
[license-shield]: https://img.shields.io/github/license/Teks-Capital/rbtcswap.svg?style=for-the-badge
[license-url]: https://creativecommons.org/licenses/by-sa/4.0/