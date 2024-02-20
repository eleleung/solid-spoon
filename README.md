# Momentum Tech Task

An important data point for many of the companies we work with is are they currently using a competitor.

One of the companies more specifically wants to know is a company using Drift live chat or Salesforce Live Agent chat.

In the project you'll find a `data` folder which contains homepages of various companies, some use Drift, some use Salesforce Live Agent some have not chat.

There is a draft endpoint here `/chat/find`, please complete the endpoint to return an array of all the companies with a field specifying which chat they are using.

Be aware that depending on how the website has installed Drift or Salesforce Live Agent the details you're looking for could be different.

Feel free to add any packages you need to the project.

## Running the code

Run `yarn install` and then `yarn dev` from the root directory, then hit `http://localhost:8080/chat/find`. Be aware the endpoint can take around 30secs+ to run (quite slow but elaborated on further down).

## Approach

To tackle this problem, I am following the general algorithm

1. First, attempt to determine the chat provider using static analysis of the html
2. If step 1 does not surface any results, perform dynamic analysis to determine if the chat is being loaded in dynamically
3. If the dynamic analysis does not surface any results, assume there is no chat

## Defining the steps

Static analysis: Simple text search over the HTML. Strings such as "https://js.driftt.com" or "salesforceliveagent" are used for first pass search attempts.

Dynamic analysis: Using Puppeteer, launch the browser in headless mode and open the HTML file. Wait for the dom content to be loaded, and for the network to be idle to account for the possiblity of the chat widget being pulled in via a JS script, Google Tag Manager.

There is a balance to strike in regards to performnance. We don't want to skip a page while it is still loading, but we also don't want to waste time waiting for a page without chat. For an MVP I have prioritised speed.

Interestingly I found that sometimes user interaction was a useful way of speeding up the loading of the widgets, so I simulated this with a click whilst trying to make sure I disabled any redirects if this click happened on a link.

The method I use to determine whether Drift or Salesforce is used is by checking the global window object. In web browsers, loaded scripts can store things in global scope which can be a straightforward way of detecing the presence of a 3rd party library. There are alternatives such as checking if a network request has been made or looking for a DOM element that could be incorporated for a more robust solution.

## Considerations and notes

- The strings that I used for the static analysis could be poor indicators and may need to be refined
- Some of the HTML pages were broken. Visiting the live webpages directly would avoid this problem but introduce other considerations.
- The endpoint currently takes from 30-50s to run on my machine which is quite slow. I'm sure there are additional improvements you could make such as reducing the necessity of loading pages dynamically, although this could be difficult. In this take-home I batch process the files and filter out the loading of images etc. that could slow the endpoint down.
- False positives are also a concern, there is an instance of this in the example data where the query string used for Drift is found but there is no widget
- Error handling has not been added
- Testing has not been added
