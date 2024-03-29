import { useEffect, useState } from 'react'
import './App.css'
import * as d3 from 'd3';
import StackedStatsTable from './StackedStatsTable.jsx';

// define outside function or it wont retain 
var playerDataFull = []


function App() {

  const [playersData, setPlayersData] = useState([])
	const [xVar, setXVar] = useState('GDP')
	const [yVar, setYVar] = useState('BA')
	// const [selectedPlayer, setSelectedPlayer] = useState<string>('')
	const [selectedPlayerData, setSelectedPlayerData] = useState()
	const [selPosition, setSelPosition] = useState('')

	// const positions = ['2B', 'RF', '1B', 'SS', 'CF', 'TWP', 'C', 'LF', '3B', 'DH', 'OF']

	const categories = ['1B', '2B', '3B', 'AB', 'BA', 'BB', 'CS', 'GDP', 'H', 'HBP', 'HR', 'K', 'OBP', 'R', 'RBI', 'SB', 'SF', 'SH', 'SLG', 'TB', 'XBH']

	async function getToken(){
		const response = await fetch('https://project.trumedianetworks.com/api/token', {
			method: 'GET', 
			headers: {
				// would not store api key here in real life
				apiKey: '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f'
			}
		})
		let token = await response.json()		
		return token.token
	}

	async function getDataVizAgg(){

		// player data 
		const token = await getToken()

		const response = await fetch('https://project.trumedianetworks.com/api/mlb/dataviz-data-aggregate', {
			method: 'GET', 
			headers: {
				tempToken: token
			}
		})

		const data = await response.json()
		
		data.forEach((player) => {
			player.BA = parseFloat(player.BA)
			player.OBP = parseFloat(player.OBP)
			player.SLG = parseFloat(player.SLG)
		})
	
		playerDataFull = data

		setPlayersData(data)

	}

	// async function getGameData(games: number){

	// 	const token = await getToken()
		
	// 	const response = await fetch(`https://project.trumedianetworks.com/api/mlb/dataviz-data-by-game/${games}`, {
	// 		method: 'GET', 
	// 		headers: {
	// 			tempToken: token
	// 		}
	// 	})

	// 	const data = await response.json()
	// 	console.log(data)

	// }


	useEffect(()=> {

		// get data 					
		Promise.all([getDataVizAgg()])
		.then(()=> {
			console.log('got data')
		})
		.catch((err) => {
			console.log(err)
		})
				

	}, [])


	useEffect(()=> {
				
		if (playersData) {
			const h = 580
		const w = 500

		const margin = 30;
		const marginLeft = 45;
		const marginTop = 40;

		const colors = d3.scaleOrdinal().domain([...new Set(playersData.map(x=> x.pos).sort())]).range(d3.schemePaired)

		const xScale = d3.scaleLinear().domain([Math.min(...playersData.map(x=> x[`${xVar}`])), Math.max(...playersData.map(x=> x[`${xVar}`]))]).range([marginLeft, w-margin])

		const yScale = d3.scaleLinear().domain([Math.max(...playersData.map(x=> x[`${yVar}`])), Math.min(...playersData.map(x=> x[`${yVar}`]))]).range([margin, h-marginTop])

		const xInvScale = d3.scaleLinear().range([Math.min(...playersData.map(x=> x[`${xVar}`])), Math.max(...playersData.map(x=> x[`${xVar}`]))]).domain([marginLeft, w-margin])

		const yInvScale = d3.scaleLinear().range([Math.max(...playersData.map(x=> x[`${yVar}`])), Math.min(...playersData.map(x=> x[`${yVar}`]))]).domain([margin, h-marginTop])
		

		d3.selectAll('.scatter').remove()

		let svg = d3.select('#dataviz').append('svg')
			.attr('class', 'scatter')
			.attr('width', w)
			.attr('height', h)
			.attr('viewBox', `0 0 ${h} ${w}`)
			
		const brush = d3.brush().on("end", ({ selection }) => {
			if (selection) {
				const [[x0, y0], [x1, y1]] = selection;			
				// console.log(selection)					

				let selectedData = playersData.filter(x=> x[xVar] >= xInvScale(x0) && x[xVar] <= xInvScale(x1) && x[yVar] <= yInvScale(y0) && x[yVar] >= yInvScale(y1))

				if (selectedData.length > 0) {
					// // y1 is further up (larger than y0)
					setPlayersData(playerDataFull.filter(x=> x[xVar] >= xInvScale(x0) && x[xVar] <= xInvScale(x1) && x[yVar] <= yInvScale(y0) && x[yVar] >= yInvScale(y1)))
				}
									
			}
		})
		.extent([[marginLeft-10,0], [w, h-margin]])  // overlay sizing
	
			//!!!! must create brush before appending bc it overlays a rect that will block mouseover events
			svg.append('g').attr('class', 'brush')
				.call(brush)
				.on("dblclick", function() {
					setPlayersData(playerDataFull)})		

		let scatter = svg.selectAll('circle').data(playersData, function(d) {
			return d.playerId
		})

		scatter.enter().append('circle')
			.attr('class', function(d){
				return `${d.currentTeamAbbrevName} ${d.pos} ${(d.pos != selPosition && selPosition != '') ? 'fade' : 'selected'}`
			})
			.on('mouseover', function(_, d) {

				// setSelectedPlayer(d.playerId)
				setSelectedPlayerData(playerDataFull.filter(x=> x.playerId == d.playerId)[0])

			})
			.on('mouseout', function() {
				d3.selectAll('.hoverlabel').remove()
			})
			.attr('cx', function(d) {
				return xScale(d[xVar])
			})
			.attr('cy', function(d){
				return yScale(d[yVar])
			})
			.attr('r', function(d){
				if (d.pos == selPosition) {
					return 8
				} else {
					return 5
				}
			})
			.attr('fill', function (d) {
				return colors(d.pos)
				
			})
			
		
		svg.append('g')
			.attr('transform', `translate(0, ${h-margin})`)
			.call(d3.axisBottom(xScale))
			.call(g => g.append('text')
				.attr('font-size', '14px')
				.attr('fill', 'black')
				.attr('x', w/2)
				.attr('y', 30)
				.text(xVar)
			)

		svg.append('g')			
			.attr('transform', `translate(${margin+5}, 0)`)
			.call(d3.axisLeft(yScale))
			.call(g => g.append('text')
				.attr('font-size', '14px')
				.attr('fill', 'black')
				.attr('x', -10)
				.attr('y', 25)
				.text(yVar)
			)
			
		let legend = svg.selectAll('rect').data([...new Set(playersData.map(x=> x.pos).sort())], function(d){
			return d
		})
			
		const legend_w = 30
		legend.enter().append('rect')
			.attr('class', (d) => d)
			.attr('x', function(d, i) {
				return (i + 1) * legend_w
			})
			.attr('y', -30)
			.attr('width', '30px')
			.attr('height', '20px')
			.attr('fill', function(_, i) {
				return d3.schemePaired[i]
			})
			.on('mouseover', function(_, d){				
				setSelPosition(d)
			})
			.on('mouseout', ()=> {
				setSelPosition('')
			})

		// if i use .join(), brush overlay rect disappears
		legend.enter().append('text')
			.attr('fill', 'black')
			.attr('y', -35)
			.attr('x', function(_, i) {
				return (i + 1) * legend_w + legend_w/2
			})
			.attr("text-anchor", "middle")			
			.attr('font-size', '12px')
			.text(function(d) {
				return d
			})
		console.log(d3.schemePaired)
		}
		

	}, [playersData, xVar, yVar, selPosition])

  return (
    <>

			<h2>Explore stats by position</h2>
			<h4>Drag and select a region to zoom. Double click on the chart to zoom out/reset. Hover over a dot to look a player. Hover over the legend to highlight by position.</h4>
			<div className='flex flex-col justify-center items-center'>
				<div className='container'>
					<div className='vertwrapper'>{categories.map(cat => <div key={`y-${cat}`} className={`${cat == yVar ? 'selected' : ''} filter`} onClick={()=> setYVar(cat)}>{cat}</div>)} </div>
					<div id='dataviz'></div>
					<div id='playercard'>
						{!selectedPlayerData && <div>Hover over a circle to select a player!</div>}
						{selectedPlayerData && <div>
							<img src={`${selectedPlayerData.playerImage}`}></img><div>{selectedPlayerData.playerFullName} | {selectedPlayerData.pos} | {selectedPlayerData.currentTeamAbbrevName}</div>
							<StackedStatsTable data={selectedPlayerData} cats={categories} start={0} stop={7} />
							<StackedStatsTable data={selectedPlayerData} cats={categories} start={7} stop={14} />
							<StackedStatsTable data={selectedPlayerData} cats={categories} start={14} stop={21} />
						</div>}
						</div>
				</div>				

				<div className='xFilter'>{categories.map(cat => <div className={`${cat == xVar ? 'selected' : ''} filter`} onClick={()=> setXVar(cat)}>{cat}</div>)} </div>
			</div>
		
			
  
    </>
  )
}

export default App
