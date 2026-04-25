"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, User, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  linkedParents?: { parent: { id: string; username: string } }[];
  linkedStudents?: { student: { id: string; username: string } }[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "STUDENT",
    parentId: "",
  });
  const { toast } = useToast();

  // Get list of parents for the dropdown
  const parents = useMemo(() => {
    return users.filter((u) => u.role === "PARENT");
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Prepare data - exclude parentId if "none" or empty
      const submitData = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        ...(formData.parentId && formData.parentId !== "none" ? { parentId: formData.parentId } : {}),
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      toast({
        title: "Success",
        description: "User created successfully!",
      });

      setDialogOpen(false);
      setFormData({ username: "", password: "", role: "STUDENT", parentId: "" });
      fetchUsers();
    } catch (error: any) {
      console.error("Create user error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully!",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Create, view, and manage user accounts</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new student, parent, or admin account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value, parentId: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Parent Selector - Only shown when creating a Student */}
                {formData.role === "STUDENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Link to Parent (Optional)</Label>
                    <Select
                      value={formData.parentId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, parentId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent link</SelectItem>
                        {parents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {parents.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No parent accounts available. Create a parent account first to link.
                      </p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
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
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600">
                      {user.role} • Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    {/* Show linked parents for students */}
                    {user.role === "STUDENT" && user.linkedParents && user.linkedParents.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Link2 className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">
                          Linked to: {user.linkedParents.map((lp) => lp.parent.username).join(", ")}
                        </span>
                      </div>
                    )}
                    {/* Show linked students for parents */}
                    {user.role === "PARENT" && user.linkedStudents && user.linkedStudents.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Link2 className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">
                          Students: {user.linkedStudents.map((ls) => ls.student.username).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
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
