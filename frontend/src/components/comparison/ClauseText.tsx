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
      <table className="w-full font-doc text-[15px] border-collapse">
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className={i === 0 ? 'font-semibold bg-gray-50' : 'border-t border-gray-200'}>
              {cells.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <p className="font-doc text-[15px] leading-[1.75] text-gray-900">{text}</p>
}

export default ClauseText