const main = document.getElementById("whole");
const routeSection = document.getElementById("route");
const listSection = document.getElementById("routeList");
const input = document.getElementById("bus");
const inputBtn = document.getElementById("inputBtn");
const selectedBtn = document.getElementById("selected");
const overlay = document.getElementById("overlay");
const keypad = document.getElementById("keypad");

function createErrorMessage() {
  // Create the container div
  const container = document.createElement("div");

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "w-6 h-6");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");

  // Create the path element for the SVG
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("d", "m6 6 12 12m3-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");

  // Append the path to the SVG
  svg.appendChild(path);

  // Create the span element
  const span = document.createElement("span");
  span.textContent = "無呢條線WO!";

  // Append the SVG and span to the container
  container.appendChild(svg);
  container.appendChild(span);
  routeSection.appendChild(container);
}

function createRouteButton(text1, text2) {
  // Create the button element
  const button = document.createElement("button");

  // Create the first <p> element
  const p1 = document.createElement("p");
  p1.textContent = text1;

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "w-6 h-6");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "0 0 24 24");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1");
  path.setAttribute("d", "m9 5 7 7-7 7");
  svg.appendChild(path);

  // Create the second <p> element
  const p2 = document.createElement("p");
  p2.textContent = text2;

  // Append the elements to the button
  button.appendChild(p1);
  button.appendChild(svg);
  button.appendChild(p2);

  routeSection.appendChild(button);
}

// createRouteButton("1","b")

function createListButton(sequence, busStop) {
  // Create the button element
  const button = document.createElement("button");

  // Create the h3 element and set its content
  const h3 = document.createElement("h3");
  h3.textContent = sequence;

  // Create the p element and set its content
  const p = document.createElement("p");
  p.textContent = busStop;

  // Append the h3 and p elements to the button
  button.appendChild(h3);
  button.appendChild(p);

  listSection.appendChild(button);
}

const returnRoute = async (busNo) => {
  const res = await fetch("https://data.etabus.gov.hk/v1/transport/kmb/route/");
  const data = await res.json();
  // console.log(data.data[0].route)
  // console.log(data.data.filter(e => e.route === busNo))
  let arr = data.data.filter((e) => e.route === busNo);
  if (arr.length !== 0) {
    // console.log(arr[0])
    arr.sort((a, b) => a.service_type - b.service_type);
    // console.log(arr)
    for (let i = 0; i < arr.length; i++) {
      createRouteButton(arr[i].orig_tc, arr[i].dest_tc);
      routeSection.children[i].addEventListener("click", function () {
        // Add a click event listener to focus selected route
        updateSelectedBtn(routeSection.children[i]);
        // Add a resize & scroll event listener to focus selected route
        window.addEventListener("resize", () => {
          let activeButton = routeSection.children[i];
          if (activeButton) {
            updateSelectedBtn(activeButton);
          }
        });
        window.addEventListener("scroll", () => {
          let activeButton = routeSection.children[i];
          if (activeButton) {
            // updateSelectedBtn(activeButton);
            const buttonRect = activeButton.getBoundingClientRect();
            selectedBtn.style.left = buttonRect.left + window.scrollX + "px";
            selectedBtn.style.top = buttonRect.top + window.scrollY + "px";
          }
        });

        listSection.innerHTML = "";
        let bound;
        let serviceType = arr[i].service_type;
        arr[i].bound === "O" ? (bound = "outbound") : (bound = "inbound");
        // console.log(bound)
        // console.log(serviceType)
        returnList(busNo, bound, serviceType);
      });
    }
    // default display first route list
    setTimeout(() => {
      routeSection.children[0].click();
    }, 300);
  } else if (input.value !== "") {
    createErrorMessage();
  }
  listSection.style.overflowY = "unset";
};

// returnRoute("1A")

const updateSelectedBtn = (button) => {
  // Get the position and size of the clicked button
  const buttonRect = button.getBoundingClientRect();

  // Update the position and size of the following element
  selectedBtn.style.left = buttonRect.left + window.scrollX + "px";
  selectedBtn.style.top = buttonRect.top + window.scrollY + "px";
  selectedBtn.style.width = buttonRect.width + "px";
  selectedBtn.style.height = buttonRect.height + "px";
  selectedBtn.style.display = "block";
};

// Pre-set for refreshing eta until close button clicked
let intervalId;
let isButtonClicked = false;

// return bustop list & eta popup section when clicked
const returnList = async (busNo, bound, serviceType) => {
  const res = await fetch(
    `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${busNo}/${bound}/${serviceType}`
  );
  const allBustop = await res.json();
  // console.log(allBustop.data)

  for (let i = 0; i < allBustop.data.length; i++) {
    let stopID = allBustop.data[i].stop;
    const res1 = await fetch(
      `https://data.etabus.gov.hk/v1/transport/kmb/stop/${stopID}`
    );
    const bustopName = await res1.json();
    // console.log(data1.data.name_tc)
    createListButton(allBustop.data[i].seq, bustopName.data.name_tc);
    listSection.children[i].addEventListener("click", function () {
      overlay.classList.add("active");
      createPopupSection(bustopName.data.name_tc);
      returnETA(busNo, stopID, serviceType, bound);
      // Refresh ETA every 1 second
      isButtonClicked = false;
      intervalId = setInterval(() => {
        if (!isButtonClicked) {
          returnETA(busNo, stopID, serviceType, bound);
        }
      }, 1000);
      // Stop interval when the button is clicked
      let closeBtn = document.getElementById("header").querySelector("button");
      closeBtn.addEventListener("click", () => {
        isButtonClicked = true;
        clearInterval(intervalId);
      });
      // console.log(bound)
    });
  }
};

// returnList("1A","inbound","1")

// Function to fetch data and update the result
function returnETA(busNo, stopID, serviceType, bound) {
  fetch(
    `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopID}/${busNo}/${serviceType}`
  )
    .then((response) => response.json())
    .then((eta) => {
      // console.log(eta.data)
      // API may contains different bound data, filter out
      let etaSeq = eta.data.filter(
        (e) => e.dir === bound[0].toUpperCase() && e.eta !== null
      );
      // console.log(etaSeq)

      if (etaSeq.length !== 0) {
        // reset
        const etaDivs = document.querySelectorAll(".eta");
        const vlDivs = document.querySelectorAll(".vl");
        etaDivs.forEach((div) => {
          div.remove();
        });
        vlDivs.forEach((div) => {
          div.remove();
        });
        // Display 1 to 3 eta
        for (let i = 0; i < etaSeq.length; i++) {
          if (etaSeq[i].eta !== null && i < 3) {
            // let time = etaSeq[i].eta.split("").indexOf("T") + 1;
            // console.log(time)
            createPopupETA(
              // etaSeq[i].eta.slice(time, time + 5),
              etaSeq[i].eta,
              etaSeq[i].rmk_tc
            );
            if (i < etaSeq.length - 1 && i < 2) {
              createVerticalLine();
            }
          }
        }
      } else {
        // reset
        const etaDivs = document.querySelectorAll(".eta");
        const vlDivs = document.querySelectorAll(".vl");
        etaDivs.forEach((div) => {
          div.remove();
        });
        vlDivs.forEach((div) => {
          div.remove();
        });
        // display if eta not exist
        noETA();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  // // Set the button click flag
  // isButtonClicked = true;
  // clearInterval(intervalId);
}

function createPopupSection(bustopName) {
  let popup = document.getElementById("popup");
  if (!popup) {
    // Create the main section element
    const popupSection = document.createElement("section");
    popupSection.id = "popup";

    // Create the header div
    const header = document.createElement("div");
    header.id = "header";

    // Create the etaTitle div
    const etaTitle = document.createElement("div");
    etaTitle.id = "etaTitle";

    // Create the station name heading and arrival time text
    const stationNameHeading = document.createElement("h2");
    stationNameHeading.textContent = bustopName;
    const arrivalTimeText = document.createElement("p");
    arrivalTimeText.textContent = "預計到達時間 (每隔1秒刷新)";

    // Append the station name and arrival time to the etaTitle div
    etaTitle.appendChild(stationNameHeading);
    etaTitle.appendChild(arrivalTimeText);

    // Create the close button SVG

    const closeButton = document.createElement("button");

    const closeButtonSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    closeButtonSvg.setAttribute("class", "w-6 h-6");
    closeButtonSvg.setAttribute("aria-hidden", "true");
    closeButtonSvg.setAttribute("width", "36");
    closeButtonSvg.setAttribute("height", "36");
    closeButtonSvg.setAttribute("fill", "none");
    closeButtonSvg.setAttribute("viewBox", "0 0 24 24");

    const closeButtonPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    closeButtonPath.setAttribute("stroke", "currentColor");
    closeButtonPath.setAttribute("stroke-linecap", "round");
    closeButtonPath.setAttribute("stroke-linejoin", "round");
    closeButtonPath.setAttribute("stroke-width", "2");
    closeButtonPath.setAttribute(
      "d",
      "m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    );

    closeButtonSvg.appendChild(closeButtonPath);
    closeButton.appendChild(closeButtonSvg);
    // Append the etaTitle and close button to the header
    header.appendChild(etaTitle);
    header.appendChild(closeButton);
    popupSection.appendChild(header);

    // Create the HR element
    const hr = document.createElement("hr");
    popupSection.appendChild(hr);
    main.appendChild(popupSection);

    closeButton.addEventListener("click", function () {
      overlay.classList.remove("active");

      popupSection.remove();
    });
  }
}

function noETA() {
  let popupSection = document.getElementById("popup");

  const etaDiv = document.createElement("div");
  etaDiv.className = "eta";
  etaDiv.style.justifyContent = "center";

  const etaLabelSpan = document.createElement("span");
  etaLabelSpan.textContent = "暫時沒有預定班次";
  etaLabelSpan.style.backgroundColor = "red";

  etaDiv.appendChild(etaLabelSpan);
  popupSection.appendChild(etaDiv);
}

function createPopupETA(time, shift) {
  let popupSection = document.getElementById("popup");

  const etaDiv = document.createElement("div");
  etaDiv.className = "eta";

  const etaSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  etaSvg.setAttribute("class", "w-6 h-6");
  etaSvg.setAttribute("aria-hidden", "true");
  etaSvg.setAttribute("width", "36");
  etaSvg.setAttribute("height", "36");
  etaSvg.setAttribute("fill", "none");
  etaSvg.setAttribute("viewBox", "0 0 24 24");

  const etaPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  etaPath.setAttribute("stroke", "currentColor");
  etaPath.setAttribute("stroke-linecap", "round");
  etaPath.setAttribute("stroke-linejoin", "round");
  etaPath.setAttribute("stroke-width", "2");
  etaPath.setAttribute("d", "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");

  etaSvg.appendChild(etaPath);

  const etaTimeDiv = document.createElement("div");
  let arriveTimeStamp = time.slice(
    time.split("").indexOf("T") + 1,
    time.split("").indexOf("T") + 6
  );

  etaTimeDiv.textContent = arriveTimeStamp;

  const etaRemainTimeDiv = document.createElement("div");
  let currentTime = new Date();
  let arriveTime = new Date(time.slice(0, time.split("").indexOf("+")));
  let difMilsec = arriveTime.getTime() - currentTime.getTime();
  let difMinute = Math.floor(difMilsec / (1000 * 60));
  if (difMinute < 0) {
    difMinute = 0;
  }
  // console.log(difMinute.toString().length);
  if (difMinute.toString().length === 1) {
    etaRemainTimeDiv.style.paddingLeft = "11px";
  }
  etaRemainTimeDiv.textContent = difMinute + "分鐘";

  const etaLabelSpan = document.createElement("span");
  etaLabelSpan.textContent = shift;

  if (shift === "原定班次") {
    etaLabelSpan.style.backgroundColor = "#eb6a00";
  } else if (shift === "") {
    etaLabelSpan.textContent = "實時班次";
    etaLabelSpan.style.backgroundColor = "#b30000";
  } else {
    etaLabelSpan.style.backgroundColor = "red";
  }

  etaDiv.appendChild(etaSvg);
  etaDiv.appendChild(etaTimeDiv);
  etaDiv.appendChild(etaRemainTimeDiv);
  etaDiv.appendChild(etaLabelSpan);

  popupSection.appendChild(etaDiv);
}

function createVerticalLine() {
  let popupSection = document.getElementById("popup");
  const verticalLine = document.createElement("div");
  verticalLine.className = "vl";
  popupSection.appendChild(verticalLine);
}

// If the user clicks the button
inputBtn.addEventListener("click", function () {
  routeSection.innerHTML = "";
  listSection.innerHTML = "";
  selectedBtn.style.display = "none";
  input.value = input.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  returnRoute(input.value);
});

// If the user presses the "Enter" key on the keyboard
input.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    routeSection.innerHTML = "";
    listSection.innerHTML = "";
    selectedBtn.style.display = "none";
    input.value = input.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    returnRoute(input.value);
  }
});

// // run JavaScript on each letter entered in a search box field
// input.addEventListener('input', function(event) {
//   const currentValue = event.target.value;
//     console.log('Current input value:', currentValue);
//     handleInput(currentValue);
// });

// function handleInput(value) {
//   routeSection.innerHTML = ""
//   listSection.innerHTML = ""
//   input.value = input.value.toUpperCase()
//   returnRoute(input.value)
// }

input.addEventListener("focus", function () {
  keypad.style.display = "flex";
});

document.addEventListener("click", (event) => {
  if (!keypad.contains(event.target) && event.target !== input) {
    keypad.style.display = "none";
  }
});

const numkeys = document.querySelectorAll(".numpad-key");

numkeys.forEach((key) => {
  key.addEventListener("click", () => {
    const value = key.textContent;
    if (value === "Enter") {
      inputBtn.click();
    } else if (value === "Clear") {
      input.value = "";
    } else {
      input.value += value;
    }
  });
});

const letterkeys = document.querySelectorAll(".letterpad-key");

letterkeys.forEach((key) => {
  key.addEventListener("click", () => {
    const value = key.textContent;
    input.value += value;
  });
});
