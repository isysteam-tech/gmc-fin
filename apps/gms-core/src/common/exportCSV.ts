import ExcelJS from 'exceljs'
import { Request, Response, NextFunction } from 'express'

interface TableCSVDTO {
    title: string
    columns: string[]
    rows: any[]
    fileName?: string
}

export async function saveAsCSV(req: Request, res: Response, next: NextFunction, tableData: TableCSVDTO): Promise<void> {
    try {
        const fileName = tableData.fileName || `export_${Date.now()}`
        const data = tableData.rows || []
        const headers = tableData.columns || []

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Data')

        // Handle empty dataset
        if (data.length === 0) {
            worksheet.addRow(['No records found'])
        } else {
            // Add column headers
            worksheet.addRow(headers)

            // Normalize rows to match header order
            const normalizedData = data.map((row: Record<string, any>) =>
                headers.map((header) => row[header] ?? '')
            )

            // Add data rows
            normalizedData.forEach((row) => worksheet.addRow(row))
        }

        // Convert to CSV buffer
        const buffer = Buffer.from(await workbook.csv.writeBuffer())

        // Set download headers
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`)
        res.setHeader('Content-Length', buffer.byteLength.toString())

        // Send file content as response
        res.send(buffer)

        console.log(`CSV file "${fileName}.csv" generated and sent successfully.`)
    } catch (err) {
        console.error('Failed to export CSV:', err)
        next(err)
    }
}
