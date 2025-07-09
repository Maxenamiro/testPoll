import * as React from 'react'
import type { IPollProps } from './IPollProps'
import styles from './Poll.module.scss'

interface IPollState {
	selectedOptions: string[]
	hasVoted: boolean
	voteData: Record<string, number>
	pollEndDate: string
	headerLabel?: string
  pollId?: number
}

export default class Poll extends React.Component<IPollProps, IPollState> {
	constructor(props: IPollProps) {
		super(props)
		this.state = {
			pollEndDate: '06.07.2025',
			selectedOptions: [],
			hasVoted: false,
			voteData: {
				Pizza: 1,
				Spaghetti: 1,
				Salat: 1,
				Risotto: 1,
				Tagessuppe: 1,
			},
		}
	}

	isVotingClosed = () => {
		const today = new Date().getTime()
		const [day, month, year] = this.state.pollEndDate.split('.')
		const endDate = new Date(+`20${year}`, +month - 1, +day).getTime()
		return today >= endDate
	}

	handleChange = (option: string) => {
		const { selectedOptions } = this.state
		const alreadySelected = selectedOptions.includes(option)
		const updatedOptions = alreadySelected
			? selectedOptions.filter((opt) => opt !== option)
			: [...selectedOptions, option]

		this.setState({ selectedOptions: updatedOptions })
	}

	handleVote = () => {
		const { selectedOptions, voteData } = this.state
		const updateVotes = { ...voteData }
		selectedOptions.forEach((option) => {
			updateVotes[option] = (updateVotes[option] || 0) + 1
		})
		this.setState({ voteData: updateVotes, hasVoted: true })
	}

	renderOptions = () => {
		const { selectedOptions, voteData } = this.state
		const options = Object.keys(voteData)

		return (
			<div className={styles.chooseOption}>
				{options.map((option, i) => (
					<div key={i} className={styles.options}>
						<input
							type='checkbox'
							id={`option-${i}`}
							checked={selectedOptions.includes(option)}
							onChange={() => this.handleChange(option)}
						/>
						<label htmlFor={`option-${i}`}>{option}</label>
					</div>
				))}
			</div>
		)
	}

	renderResults = () => {
		const { voteData } = this.state
		const totalVotes = Object.values(voteData).reduce((a, b) => a + b, 0)

		return (
			<div className={styles.chooseOption}>
				{Object.entries(voteData).map(([option, count], i) => {
					const percent = totalVotes ? (count / totalVotes) * 100 : 0

					return (
						<div key={i} className={styles.resultRow}>
							<span className={styles.resultLabel}>{option}</span>
							{/* <div className={styles.voteContainer}> */}
							<span className={styles.voteCount}>{count}</span>
							<div className={styles.progressBar}>
								<div
									className={styles.progressFill}
									style={{ width: `${percent}%` }}
								/>
							</div>
							{/* </div> */}
						</div>
					)
				})}
			</div>
		)
	}

	renderFinalResults = () => {
		const { voteData } = this.state
		const totalVotes = Object.values(voteData).reduce((a, b) => a + b, 0)

		return (
			<div className={styles.finalResults}>
				{Object.entries(voteData).map(([option, count], i) => {
					const percent = totalVotes ? (count / totalVotes) * 100 : 0
					const displayPercent = percent.toFixed(1).replace('.', ',')

					return (
						<div key={i} className={styles.resultRow}>
							<span className={styles.finalResultLabel}>
								{option}: {displayPercent}%
							</span>
							<div className={styles.finalProgressBar}>
								<div
									className={styles.progressFill}
									style={{ width: `${percent}%` }}
								/>
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	render(): React.ReactElement<IPollProps> {
		const { hasVoted, voteData, selectedOptions, pollEndDate } = this.state
		const isClosed = this.isVotingClosed()
		// const isClosed = true
		const totalVotes = Object.values(voteData).reduce((a, b) => a + b, 0)

		return (
			<section>
				<div className={styles.container}>
					<div className={styles.column}>
						<span className={styles.title}>
							{this.state.headerLabel ||
								'Welche italienischen Gerichte würden Sie sich auf dem Speiseplan wünschen?'}
						</span>
						<p className={styles.subTitle}>
							{isClosed
								? `Insgesamt haben ${totalVotes} Personen abgestimmt:`
								: hasVoted
								? `Abstimmungsende: ${pollEndDate} | Aktuell: ${totalVotes} Teilnehmer`
								: `Abstimmungsende: ${pollEndDate} | Wählen Sie eine oder mehrere Option aus:`}
						</p>
					</div>

					{/* Main content area */}
					{isClosed
						? this.renderFinalResults()
						: hasVoted
						? this.renderResults()
						: this.renderOptions()}

					{/* Submit button or message */}
					<div className={styles.submitButton}>
						{!hasVoted && !isClosed && (
							<button
								className={styles.button}
								onClick={this.handleVote}
								disabled={selectedOptions.length === 0}
							>
								Abstimmen
							</button>
						)}
						{hasVoted && !isClosed && (
							<div className={styles.votedMessage}>
								Sie haben erfolgreich abgestimmt!
							</div>
						)}
					</div>
				</div>
			</section>
		)
	}

	fetchVotedData = async () => {
		const response = await fetch(
			"https://aonicdemotenant.sharepoint.com/sites/Merck/_api/web/lists/getbytitle('Counter')/items",
			{
				headers: {
					Accept: 'application/json;odata=verbose',
				},
			}
		)

		const data = await response.json()
		const items = data.d.results

		console.log('SharePoint Items:', items)

		///

		const currentPoll = items.find(
			(item: any) => item.PollStillActive === 'True'
		)
		if (!currentPoll) return

		const pollEndDate = currentPoll.EndDate.split('T')[0]
		const headerLabel = currentPoll.PollName

		////

		const voteData: Record<string, number> = {}
		for (let i = 1; i <= 10; i++) {
			const answer = currentPoll[`Answer%{i}`]
			if (answer) voteData[answer] = 0
		}

		//////

    try {
      const votesJson = JSON.parse(currentPoll.AnswerVotesJson || '{}')
      for (const [answer, ids] of Object.entries(votesJson)) {
        if (Array.isArray(ids)) {
          voteData[answer] = ids.length
        }
      }
    } catch (error) {
      console.error('Error parsing JSON AAAAAAAAAAAAAAAAAAAAAA', error)
    }

    this.setState({
      pollEndDate,
      headerLabel,
      voteData,
    })
	}
}
