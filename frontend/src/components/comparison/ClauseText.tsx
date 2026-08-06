interface ClauseTextProps {
  text: string
}

function ClauseText({ text }: ClauseTextProps) {
  if (text.startsWith('[TABLE]')) {
    const rows = text
      .replace('[TABLE]\n', '')
      .split('\n')
      .map((row) => row.split(' | '))

    return (
      <table className="w-full text-sm border-collapse">
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className={i === 0 ? 'font-medium bg-gray-100' : 'border-t'}>
              {cells.map((cell, j) => (
                <td key={j} className="px-2 py-1">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <p className="text-sm">{text}</p>
}

export default ClauseText