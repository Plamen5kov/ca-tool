import router from '@/router'
import staticProposals from '@/assets/data/proposals.json'

const allChallenge = {
  title: "All",
  id: 0,
  count: 944
}
// initial state
const getDefaultState = () => ({
  currentIndex: 0,
  keyword: '',
  selectedChallenges: [allChallenge],
  proposals: staticProposals,
  lastUpdate: false
})
const state = getDefaultState()

// getters
const getters = {
  filteredProposals: (state, _, rootState, rootGetters) => {
    let lproposals = state.proposals
    if (state.selectedChallenges.length > 0) {
      let filters = state.selectedChallenges.map(el => el.id)
      if (filters.indexOf(0) === -1) {
        lproposals = lproposals.filter(p => filters.indexOf(p.category) > -1)
      }
    }
    let locAssessmentsIds = rootGetters['assessments/ids']
    if (locAssessmentsIds.length > 0) {
      lproposals = lproposals.filter(p => locAssessmentsIds.indexOf(p.id) === -1)
    }
    if (state.keyword.trim().length >= 3) {
      lproposals = lproposals.filter(
        (el) => el.title.toLowerCase().includes(state.keyword.toLowerCase())
      )
    }
    return lproposals
      // .sort(() => (Math.random() > .5) ? 1 : -1)
      .sort(
        (a,b) => (a.no_assessments > b.no_assessments) ? 1 : ((b.no_assessments > a.no_assessments) ? -1 : 0)
      )
  },
  totalCount: (state) => {
    return state.proposals.reduce((n, {no_assessments}) => n + (no_assessments || 0), 0)
  },
  totalProposals: (state) => {
    return state.proposals.length
  },
  getById: (state) => (id) => {
    let filtered = state.proposals.filter(p => (p.id === id))
    if (filtered.length) {
      return filtered[0]
    }
    return false
  },
}

// actions
const actions = {
  getAssessmentsCount ({ commit }) {
    const proposals = staticProposals
    this._vm.$http.get('proposals.json').then((res) => {
      if (res.data) {
        let remoteProposals = res.data
        remoteProposals.forEach((r) => {
          let selected = proposals.find((p) => p.id === r.id)
          if (selected) {
            selected.no_assessments = r.assessments_count
          }
        })
        commit('setProposals', proposals)
      }
    })
  },
  getLastUpdate ({ commit }) {
    let lastCommitUrl = `${process.env.VUE_APP_GITHUB_API_BACKEND_URL}commits?per_page=1`
    this._vm.$http.get(lastCommitUrl).then((res) => {
      if (res.data) {
        if (res.data.length > 0) {
          const lastCommitDate = res.data[0].commit.author.date
          commit('setLastUpdate', lastCommitDate)
        }
      }
    })
  },
  getNext({ commit, state, getters }, fromFilter) {
    let fProposals = getters.filteredProposals
    if (fProposals[state.currentIndex]) {
      let newId = fProposals[state.currentIndex].id
      let currentId = false
      if (router.currentRoute.name === 'Proposal' || !fromFilter) {
        currentId = router.currentRoute.params.id
        if (newId !== currentId) {
          router.push({ name: 'Proposal', params:{ id: newId }})
        }
      }
      commit('setCurrentIndex', state.currentIndex + 1)
    } else {
      commit('setCurrentIndex', 0)
    }
  },
}

// mutations
const mutations = {
  setLastUpdate (state, lastUpdate) {
    state.lastUpdate = lastUpdate
  },
  setProposals (state, proposals) {
    state.proposals = proposals
  },
  addChallenge(state, challenge) {
    state.currentIndex = 0
    var found = state.selectedChallenges.filter((schallenge) => challenge.id === schallenge.id)
    if (found.length === 0) {
      if (challenge.id === 0) {
        state.selectedChallenges = [challenge]
      } else {
        var foundAll = state.selectedChallenges.filter((schallenge) => 0 === schallenge.id)
        if (foundAll.length > 0) {
          state.selectedChallenges.splice(foundAll, 1)
        }
        state.selectedChallenges.push(challenge)
      }
    }
    this.dispatch('filters/getNext', true)
  },
  removeChallenge(state, challenge) {
    state.currentIndex = 0
    var found = state.selectedChallenges.filter((schallenge) => challenge.id === schallenge.id)
    if (found.length > 0) {
      state.selectedChallenges.splice(found, 1)
      if (state.selectedChallenges.length === 0) {
        state.selectedChallenges.push(allChallenge)
      }
    }
    this.dispatch('filters/getNext', true)
  },
  setKeyword(state, keyword) {
    state.currentIndex = 0
    state.keyword = keyword
    this.dispatch('filters/getNext', true)
  },
  setCurrentIndex(state, index) {
    state.currentIndex = index
  },
  resetState (state) {
    //state.currentIndex = 0
    //state.keyword = ''
    //state.selectedChallenges = []
    Object.assign(state, getDefaultState())
    this.dispatch('filters/getLastUpdate')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
