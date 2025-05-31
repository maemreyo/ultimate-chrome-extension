import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~components/ui/badge'
import { Button } from '~components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~components/ui/card'
import { Input } from '~components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~components/ui/table'
import { useStorageQuery } from '../hooks/useAdvancedStorage'
import { storageManager } from '../storage-manager'
import type { StorageItem } from '../types'

export function StorageExplorer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null)

  const { data, loading, refetch } = useStorageQuery({
    limit: 10,
    offset: page * 10,
    orderBy: 'metadata.updated:desc'
  })

  const handleSearch = () => {
    refetch({
      where: searchTerm ? { 'key': searchTerm } : undefined,
      limit: 10,
      offset: 0
    })
    setPage(0)
  }

  const handleDelete = async (key: string) => {
    if (confirm(`Delete item with key "${key}"?`)) {
      const storage = storageManager.get()
      await storage.delete(key)
      await refetch()
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Explorer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item: StorageItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.key}</TableCell>
                      <TableCell>{formatSize(item.metadata.size)}</TableCell>
                      <TableCell>{formatDate(item.metadata.updated)}</TableCell>
                      <TableCell>
                        {item.metadata.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="mr-1">
                            {tag}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(item.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={data.length < 10}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
