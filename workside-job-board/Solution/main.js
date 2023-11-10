// import jobData from './assets/job-data.json' assert {type: 'json'}
import {
  getAllElementsMapWithDataJSAttribute,
  getJobData,
  populateAsideFilterUI, populateJobCardsUI, displayJobInfoUI,
  filterJobOfferts,
  fillDeclarativeTemplate
} from './utils-module.js'


// Avoid scrolling when using `Space` on a focusable element
window.addEventListener('keydown', event => {
  if (event.code === 'Space') event.preventDefault()
})


const fakeData = await getJobData()

if (!fakeData) {
  throw new TypeError(`Failed to fetch the resource`)
}

const {
  filterAside,
  filterAsideTemplate,

  jobCards,
  jobCardTemplate,

  jobInfo,
  jobInfoTemplate,

  noJobMatchFilterMessageTemplate
} = getAllElementsMapWithDataJSAttribute()


/**
 * Handle the state of the filters applied to the jobs
 */
const filterState = {}

fakeData.filters.forEach(filter => {
  filterState[filter.name] = {}

  filter.list.forEach(item => filterState[filter.name][item] = false)
})



populateAsideFilterUI(filterAside, filterAsideTemplate, fakeData.filters)


populateAndAddListenersToJobCards(fakeData.jobs)




// Handle filter check-box toggle
window.addEventListener('click', filterJobsEventHandler)
window.addEventListener('keyup', filterJobsEventHandler)






function filterJobsEventHandler(event) {
  const labelCheckbox = event.target.closest('.label-checkbox')
  if (!labelCheckbox) return

  event.preventDefault()

  if (event.type === 'keyup' && event.code !== 'Space') {
    return
  }

  const checkbox = labelCheckbox.querySelector('.check-box')

  const filterType = labelCheckbox.parentElement.dataset.filterType
  const filterName = labelCheckbox.dataset.filter


  filterState[filterType][filterName] = checkbox.ariaChecked = checkbox.classList.toggle('-checked')

  const displayedJobs = filterJobOfferts(fakeData.jobs, filterState)

  populateAndAddListenersToJobCards(displayedJobs)
}


/**
 * 
 * @param {Job[]} jobData  
 */
function populateAndAddListenersToJobCards(jobData) {
  populateJobCardsUI(jobCards, jobCardTemplate, jobData)

  if (jobData.length === 0) {
    jobCards.append(noJobMatchFilterMessageTemplate.content.cloneNode(true))
    return
  }

  jobCards.querySelectorAll(':scope > *').forEach(item => {
    item.addEventListener('click', event => {
      displayJobInfoUI(jobInfo, jobInfoTemplate, jobData[item.dataset.index])
    })

    item.addEventListener('keyup', event => {
      if (event.code !== 'Space') return

      displayJobInfoUI(jobInfo, jobInfoTemplate, jobData[item.dataset.index])
    })
  })
}
