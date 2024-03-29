function StackedStatsTable( {cats, data, start, stop}){

	return (
		<div>
			<table className="stackedTable">
				<thead>
					<tr>
						{(cats.filter((_, i) => i >= start && i < stop).map(x=> <th className="data" key={x}>{x}</th>))}
					</tr>					
				</thead>
				<tbody>
					<tr>{(cats.filter((_, i) => i >= start && i < stop).map(x=> <td className="data" key={`${x}-data`}>{data[x]}</td>))}</tr>					
				</tbody>
			</table>
		</div>
	)
}

export default StackedStatsTable