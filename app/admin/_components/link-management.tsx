"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link2, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  role: string;
  linkedParents?: any[];
  linkedStudents?: any[];
}

export default function LinkManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    parentId: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStudents(data.users?.filter((u: User) => u.role === "STUDENT") || []);
        setParents(data.users?.filter((u: User) => u.role === "PARENT") || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/admin/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create link");
      }

      toast({
        title: "Success",
        description: "Student and parent linked successfully!",
      });

      setDialogOpen(false);
      setFormData({ studentId: "", parentId: "" });
      fetchUsers();
    } catch (error: any) {
      console.error("Create link error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create link",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLink = async (studentId: string, parentId: string) => {
    if (!confirm("Are you sure you want to remove this link?")) return;

    try {
      const response = await fetch("/api/admin/link", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, parentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete link");
      }

      toast({
        title: "Success",
        description: "Link removed successfully!",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Delete link error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  const studentLinks = students.flatMap((student) =>
    student.linkedParents?.map((link) => ({
      student,
      parent: link.parent,
    })) || []
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student-Parent Links</CardTitle>
            <CardDescription>Manage relationships between students and parents</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Student-Parent Link</DialogTitle>
                <DialogDescription>
                  Link a parent account to a student account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student</label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, studentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent</label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, parentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Link"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
          </div>
        ) : studentLinks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Link2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No links created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentLinks.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <Link2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {link.student.username} → {link.parent.username}
                    </p>
                    <p className="text-sm text-gray-600">
                      Student linked to Parent
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLink(link.student.id, link.parent.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
