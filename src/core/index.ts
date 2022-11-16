import { SingleSongProps, SingleSongBriefInfo } from "./core"
import { logWarn, throwError } from "./utils"

interface MusicPlayerCoreProps {

}

/**
 * 1. Play in order
 * 2. Play in loop
 * 3. Play in single song
 * 4. Play in random song
 */
type PlayModeType = 1 | 2 | 3 | 4

function checkUndefined(p: any) {
  if (typeof p === 'undefined') throwError('Expect other value but got undefined')
}

class MusicPlayerCore {
  public e: HTMLAudioElement
  public SongIdList: number[]
  public CurrentSongId: number
  public IsPlaying: boolean
  public SongIdMap: { [key: number]: SingleSongProps }
  public PlayMode: PlayModeType

  constructor({ ...props }: MusicPlayerCoreProps) {
    this.e = document.createElement('audio')
    this.SongIdList = []
    this.SongIdMap = {}
    this.PlayMode = 1
    this.CurrentSongId = -1
    this.IsPlaying = false
  }

  private _AppendSongByIndex(song: SingleSongProps, index: number) {
    this.SongIdList.splice(index, 0, song.id)
    this.SongIdMap[song.id] = song
  }

  private _ApeendCheck(song: SingleSongProps) {
    if (!song)
      throwError('AppendSong function had been call but without song info.')
    else if (this.SongIdList.indexOf(song.id) !== -1 || this.SongIdMap[song.id])
      throwError(`The song which append to queue has repeat id.`)
  }

  /**
   * Query song's id.
   * @param mark Song's id or name, if use name, the query will begin at head.
   * @param fromTail Let query begin at tail.
   * @returns The info of the song.
   */
  QuerySongInfo(mark: string | number, fromTail = false) {
    let qId = -1
    if (typeof mark === 'number') qId = mark
    else {
      for (const i in this.SongIdMap) {
        const val = this.SongIdMap[i]
        if ((qId === -1 || fromTail) && val.name === mark) qId = parseInt(i)
      }
    }
    return this.SongIdMap[qId]
  }

  /**
   * Remove a song from songs list.If the song is playing, then will be stop and switch to next song.
   * @param mark Song's id or name.
   * @param fromTail Delete song from tail.
   */
  RemoveSong(mark: string | number, fromTail = false) {
    checkUndefined(mark)
    const p = this.QuerySongInfo(mark, fromTail)
    if (p) {
      // if it's current song, stop it.
      if (this.CurrentSongId === p.id) {
        if (this.SongIdList.length === 1) {
          this.e.pause()
          this.e.src = ''
        } else {
          let i = this.SongIdList.indexOf(p.id)
          if (i === this.SongIdList.length - 1) i = 0
          else i++
          const info = this.SongIdMap[this.SongIdList[i]]
          if (info) {
            this.CurrentSongId = info.id
            this.e.src = info.src
          }
        }
      }
      Object
      delete this.SongIdMap[p.id]
      this.SongIdList.splice(this.SongIdList.indexOf(p.id), 1)
    }
  }

  /**
   * Append a song to songs list.
   * @param song Song's info.
   * @param mark Append the song after appoint song id or name.If it's undefined, it will append to tail.
   * @param fromTail Query song from list tail and append it.
   */
  AppendSong(song: SingleSongProps, mark?: string | number, fromTail = false) {
    this._ApeendCheck(song)
    let appendPos = typeof mark === 'number' ? mark : this.SongIdList.length
    if (typeof mark === 'string') {
      const s = this.QuerySongInfo(mark, fromTail)
      if (s) {
        const p = this.SongIdList.indexOf(s.id)
        if (p < appendPos && p >= 0) appendPos = p + 1
      }
    }
    this._AppendSongByIndex(song, appendPos)
  }

  /**
   * Append a song to songs list head.
   * @param song Song's info.
   */
  AppendSongOnHead(song: SingleSongProps) {
    this._ApeendCheck(song)
    this._AppendSongByIndex(song, -1)
  }

  /**
   * Append a song to songs list tail.
   * @param song Song's info.
   */
  AppendSongOnTail(song: SingleSongProps) {
    this._ApeendCheck(song)
    this._AppendSongByIndex(song, this.SongIdList.length)
  }

  /**
   * Append a song list at tail.
   * @param songs Song List.
   */
  AppendSongList(songs: SingleSongProps[]) {
    songs.forEach((val) => {
      this.AppendSongOnTail(val)
    })
  }

  /**
   * Update Song Position on SongIdList
   * @param list New songs list position array
   */
  UpdateSongPosition(list: number[]) {
    // Check list size.
    if (list.length != this.SongIdList.length)
      throwError('Update Song Position size is not equal with old list size')

    // Check new list has other number.
    const s = new Set(this.SongIdList.map((val) => val))
    list.forEach((val) => { s.delete(val) })
    if (s.size) {
      const l: number[] = []
      s.forEach((val) => {
        l.push(val)
      })
      throwError('New list has unknown id: ' + l)
    }

    this.SongIdList = list
  }

  /**
   * Play song with seleted song's id.
   * @param id Song's id.
   */
  PlaySelectSong(id: number) {
    const s = this.SongIdMap[id]
    if (this.SongIdList.indexOf(id) === -1) logWarn(`Song's id: '${id}' is not in the id list or it's not corrent number.`)
    if (s) {
      this.e.src = s.src
      this.CurrentSongId = id
    }
  }

  NextSong() {
    const p = this.SongIdList.indexOf(this.CurrentSongId)
    let pos = 0
    if (p !== this.SongIdList.length - 1) pos = p
    this.PlaySelectSong(this.SongIdList[pos])
  }

  PrevSong() {
    const p = this.SongIdList.indexOf(this.CurrentSongId)
    let pos = this.SongIdList.length - 1
    if (p !== 0) pos = p
    this.PlaySelectSong(this.SongIdList[pos])
  }

  /**
   * Play the song.
   * **Note**: If current song is null, it will begin at head.
   */
  async Play() {
    if (this.e.src.length === 0) {
      this.PlaySelectSong(this.SongIdList[0])
    }
    await this.e.play()
    this.IsPlaying = true
  }

  Pause() {
    this.e.pause()
    this.IsPlaying = false
  }

  ChangeVolume(vol: number) {
    if (vol >= 0 && vol <= 1) this.e.volume = vol
  }

  ChangeCurrentSongTime(time: number) {
    if (typeof time !== 'number') {
      logWarn('Type of time expect number but got: ' + typeof time)
      return
    }
    this.e.currentTime = time
  }
}

export default MusicPlayerCore