/* globals APIKEY */

let myFirstApp = (function () {

    const movieDataBaseURL = "https://api.themoviedb.org/3/";
    let imageURL = null;
    let imageSizes = [];
    let searchString = "searchString";
    let typeKey = "type";
    let type = "movie";
    let imageURLKey = "imageURL";
    let imageSizeKey = "imageSize";
    let timeKey = "timeKey";
    let staleDataTimeOut = 3600;

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        addEventListeners();
        getDataFromLocalStorage();
    }

    function addEventListeners() {
        document.querySelector(".searchButtonSpan").addEventListener("click", startSearch);
        document.addEventListener("keypress", function (e) {
            if (e.keyCode == 13) {
                startSearch();
            }
        });

        document.getElementById("back-button").addEventListener("click", backPage);

        document.querySelector(".changeTypeSpan").addEventListener("click", showOverlay);
        document.querySelector(".cancelButton").addEventListener("click", hideOverlay);
        document.querySelector(".overlay").addEventListener("click", hideOverlay);

        document.querySelector(".saveButton").addEventListener("click", littleWindow);

    }


    function littleWindow(e) {

        let typeList = document.getElementsByName("type");
        let titleImg = document.querySelector(".title-img");

        for (let i = 0; i < typeList.length; i++) {
            if (typeList[i].checked) {
                type = typeList[i].value;
                break;
            }
        }
        if (type == "tv") {
            titleImg.src = "img/TV-title.png";
            document.querySelector("title").textContent = "TV Recommendations"
        } else {
            titleImg.src = "img/movie-title.png";
            document.querySelector("title").textContent = "Movie Recommendations"
        }

        localStorage.setItem(typeKey, JSON.stringify(type));
        hideOverlay(e);
    }

    function getDataFromLocalStorage() {

        if (localStorage.getItem(imageSizeKey) && localStorage.getItem(imageURLKey) && localStorage.getItem(timeKey)) {

            let seconds = calculateElapsedTime();

            if (seconds > staleDataTimeOut) {
                getPosterURLAndSizes();
            }

        } else {
            getPosterURLAndSizes();
        }
    }

    function calculateElapsedTime() {
        let savedDate = localStorage.getItem(timeKey);
        let now = new Date();
        savedDate = new Date(savedDate);

        let elapsedTime = now.getTime() - savedDate.getTime();
        let seconds = Math.ceil(elapsedTime / 1000);
        return seconds;
    }


    function getPosterURLAndSizes() {
        let url = `${movieDataBaseURL}configuration?api_key=${APIKEY}`;

        fetch(url)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {

                imageURL = data.images.secure_base_url;
                imageSizes = data.images.poster_sizes;

                let now = new Date();
                localStorage.setItem(timeKey, now);

                localStorage.setItem(imageURLKey, JSON.stringify(imageURL));

                localStorage.setItem(imageSizeKey, JSON.stringify(imageSizes));

            })
            .catch(function (error) {
                console.log(error);
            })
    }

    function startSearch() {

        searchString = document.getElementById("search-input").value;
        if (!searchString) {
            alert("Please enter search data");
            document.getElementById("search-input").focus();
            return;
        }
        document.querySelector("header").classList.add("hidden");
        getSearchResults();
    }

    function getSearchResults() {
        document.getElementById("search-results").classList.remove("no");

        if (localStorage.getItem(typeKey)) {
            type = JSON.parse(localStorage.getItem(typeKey));
        } else {
            localStorage.setItem(typeKey, JSON.stringify(type));
            type = JSON.parse(localStorage.getItem(typeKey));
        }

        document.getElementById("back-button").classList.remove("no");

        let url = `${movieDataBaseURL}search/${type}?api_key=${APIKEY}&query=${searchString}`;


        fetch(url)
            .then((response) =>
                response.json())
            .then(function (data) {

                let content = document.querySelector("#search-results>.content");
                content.innerHTML = "";

                let cards = [];
                for (let i = 0; i < data.results.length; i++) {

                    let movie = data.results[i];
                    cards.push(createMovieCard(movie));
                }

                let documentFragment = new DocumentFragment();

                cards.forEach(function (item) {
                    documentFragment.appendChild(item);
                });

                content.appendChild(documentFragment);

                let cardList = document.querySelectorAll(".content>div");

                cardList.forEach(function (item) {
                    item.addEventListener("click", getRecommendations);
                });
            })

            .catch((error) => alert(error));
    }

    function createMovieCard(movie) {
        let documentFragment = new DocumentFragment(); // use a documentFragment for performance

        let movieCard = document.createElement("div");
        let image = document.createElement("img");
        let videoTitle = document.createElement("p");
        let videoDate = document.createElement("p");
        let videoRating = document.createElement("p");
        let videoOverview = document.createElement("p");

        // set up the content
        if (JSON.parse(localStorage.getItem(typeKey)) == "movie") {
            videoTitle.textContent = movie.title;
            movieCard.setAttribute("data-title", movie.title);
            videoDate.textContent = movie.release_date;
            image.setAttribute("alt", movie.title);
        } else {

            videoTitle.textContent = movie.name;
            movieCard.setAttribute("data-title", movie.name);
            videoDate.textContent = movie.first_air_date;
            image.setAttribute("alt", movie.name);
        }


        let rating = movie.vote_average;
        let times;

        if (rating < 2) {
            times = 1;
        } else if (rating < 4) {
            times = 2;
        } else if (rating < 6) {
            times = 3;
        } else if (rating < 8) {
            times = 4;
        } else {
            times = 5;
        }

        for (let i = 0; i < times; i++) {
            let stars = document.createElement("span");
            let star = document.createElement("img");
            star.src = "img/star.svg";
            stars.appendChild(star);
            videoRating.appendChild(stars);
        }


        videoOverview.textContent = movie.overview;

        // set up image source URL

        imageSizes = JSON.parse(localStorage.getItem(imageSizeKey));
        imageURL = JSON.parse(localStorage.getItem(imageURLKey));


        image.src = `${imageURL}${imageSizes[2]}${movie.poster_path}`;

        // set up movie data attributes
        movieCard.setAttribute("data-id", movie.id);


        // set up class names
        movieCard.className = "movieCard";
        image.className = "imageSection";
        videoTitle.className = "title";
        videoDate.className = "date";
        videoRating.className = "rating";
        videoOverview.className = "overview";

        // append elements
        movieCard.appendChild(image);
        movieCard.appendChild(videoTitle);
        movieCard.appendChild(videoDate);
        movieCard.appendChild(videoRating);
        movieCard.appendChild(videoOverview);

        documentFragment.appendChild(movieCard);

        return documentFragment;
    }

    function getRecommendations() {


        let movieTitle = this.getAttribute("data-title");
        let movieId = this.getAttribute("data-id");

        let type = JSON.parse(localStorage.getItem(typeKey));

        let url = `https://api.themoviedb.org/3/${type}/${movieId}/recommendations?api_key=${APIKEY}&language=en-US&page=1`

        document.querySelector("#search-input").value = movieTitle;

        document.getElementById("search-results").classList.add("no");


        fetch(url)
            .then((response) =>
                response.json())
            .then(function (data) {

                let RecommPage = document.getElementById("recommend-results");

                if (RecommPage.classList.contains("no")) {
                    RecommPage.classList.remove("no");
                }
                let content = document.querySelector("#recommend-results>.content");
                content.innerHTML = "";

                let cards = [];
                for (let i = 0; i < data.results.length; i++) {
                    let movie = data.results[i];
                    cards.push(createMovieCard(movie));
                }

                let documentFragment = new DocumentFragment();

                cards.forEach(function (item) {
                    documentFragment.appendChild(item);
                });

                content.appendChild(documentFragment);

                let cardList = document.querySelectorAll(".content>div");

                cardList.forEach(function (item) {
                    item.addEventListener("click", getRecommendations);
                });
            })

            .catch((error) => alert(error));
    }

    function showOverlay(e) {
        e.preventDefault();
        let overlay = document.querySelector(".overlay");
        overlay.classList.remove("no");
        overlay.classList.add("yes");
        showModal(e);
    }

    function showModal(e) {
        e.preventDefault();
        let modal = document.querySelector(".modal");
        modal.classList.remove("off");
        modal.classList.add("on");
    }

    function hideOverlay(e) {
        e.preventDefault();
        e.stopPropagation(); // don't allow clicks to pass through
        let overlay = document.querySelector(".overlay");
        overlay.classList.remove("yes");
        overlay.classList.add("no");
        hideModal(e);
    }

    function hideModal(e) {
        e.preventDefault();
        let modal = document.querySelector(".modal");
        modal.classList.remove("on");
        modal.classList.add("off");
    }

    function backPage() {
        let searchPge = document.getElementById("search-results");
        let RecommPage = document.getElementById("recommend-results");

        if (searchPge.classList.contains("no")) {
            searchPge.classList.remove("no");
            RecommPage.classList.add("no");
        } else {
            searchPge.classList.add("no");
            document.getElementById("back-button").classList.add("no");
            document.querySelector("header").classList.remove("hidden");
            document.getElementById("search-input").value = "";
        }
    }

})();
