document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: fetchPageDetails
      },
      (results) => {
        if (results && results[0]) {
          const pageDetails = results[0].result;
          displayPageDetails(pageDetails);
        } else {
          document.getElementById("output").textContent = "Error fetching page details.";
        }
      }
    );
  });
});

function fetchPageDetails() {
  const metaTitle = document.querySelector("title") ? document.querySelector("title").innerText : "No title";
  const metaDescription = document.querySelector("meta[name='description']") ? document.querySelector("meta[name='description']").getAttribute("content") : "No description";

  const headings = ["h1", "h2", "h3", "h4", "h5"].reduce((acc, tag) => {
    const elements = Array.from(document.querySelectorAll(tag));
    acc[tag] = elements.map(el => el.innerText);
    return acc;
  }, {});

  const images = Array.from(document.querySelectorAll("img"));
  
  // Filter images based on whether they have alt content or not
  const imagesWithAltContent = images.filter(img => img.hasAttribute("alt") && img.getAttribute("alt").trim() !== "");
  const imagesWithoutAltContent = images.filter(img => !img.hasAttribute("alt") || img.getAttribute("alt").trim() === "");

  // Get image URLs for those without alt content
  const imagesWithoutAltContentUrls = imagesWithoutAltContent.map(img => {
    const imgSrc = img.getAttribute("src");
    return imgSrc ? imgSrc : "No src attribute";
  });

  return { metaTitle, metaDescription, headings, imagesWithAltContent, imagesWithoutAltContent, imagesWithoutAltContentUrls };
}

function displayPageDetails(pageDetails) {
  const output = document.getElementById("output");

  // Check title and description length
  const titleLength = pageDetails.metaTitle.length;
  const descriptionLength = pageDetails.metaDescription.length;
  const titleError = titleLength > 60 ? "<p style='color:red;'>Please shorten Title below 60 characters</p>" : "";
  const descriptionError = (descriptionLength > 320 || descriptionLength < 120) 
    ? `<p style='color:red;'>Description length is ${descriptionLength} characters. Please ensure it's between 120 and 320 characters.</p>` 
    : "";

  // Check if there are no H1 headings or more than one
  const h1Count = pageDetails.headings.h1.length;
  let h1Error = '';
  if (h1Count === 0) {
    h1Error = "<p style='color:red;'>Please add H1</p>";
  } else if (h1Count > 1) {
    h1Error = "<p style='color:red;'>Please Keep only 1 H1 per page</p>";
  }

  // Display images with and without alt content
  const imagesWithAltContentCount = pageDetails.imagesWithAltContent.length;
  const imagesWithoutAltContentCount = pageDetails.imagesWithoutAltContent.length;
  const imagesWithoutAltContentUrls = pageDetails.imagesWithoutAltContentUrls.map(url => `<img src="${url}" />`).join("");

  output.innerHTML = `
    <p><strong>Meta Title:</strong> ${pageDetails.metaTitle} (${titleLength} characters)</p>
    ${titleError}
    <p><strong>Meta Description:</strong> ${pageDetails.metaDescription} (${descriptionLength} characters)</p>
    ${descriptionError}
    <div class="info-section">
      <h3>Headings:</h3>
      ${h1Error}
      <p><strong>H1 (${h1Count}):</strong></p>
      ${pageDetails.headings.h1.map(content => `<p class="heading-content">${content}</p>`).join('')}
      ${["h2", "h3", "h4", "h5"].map(tag => `
        <p><strong>${tag.toUpperCase()} (${pageDetails.headings[tag].length})</strong></p>
      `).join('')}
    </div>
    <div class="info-section">
      <h3>Image Information:</h3>
      <p>Images with "alt" content: ${imagesWithAltContentCount}</p>
      <p>Images without "alt" content: ${imagesWithoutAltContentCount}</p>
      <div class="image-grid">${imagesWithoutAltContentUrls}</div>
    </div>
  `;
}
