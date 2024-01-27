import { makeAutoObservable } from 'mobx'


import HomeStore from './HomeStore/HomeStore'
export class RootStore {
  homeStore: HomeStore


  constructor() {
    makeAutoObservable(this)

    this.homeStore = new HomeStore()
  
  }

  resetAll = () => {
    for (const [key, value] of Object.entries(this)) {
      if (key !== 'resetAll') {
        this[key as keyof RootStore] = new value.constructor()
      }
    }
  }
}

const rootStore = new RootStore()

export  {rootStore}
