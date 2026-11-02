import { prisma } from "../lib/prisma.js";
import { type as projectType, Status as projectStatus } from "@prisma/client";
import { getTenantFilter } from "../middleware/auth.middleware.js";

// GET /api/projects/enums
export const getProjectEnums = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        types: Object.values(projectType),
        statuses: Object.values(projectStatus)
      }
    });
  } catch (error) {
    console.error("Error fetching project enums:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET /api/projects
export const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      project_deleted_at: null,
      ...getTenantFilter(req),
    };

    if (search) {
      where.OR = [
        { project_name: { contains: search } },
        { project_location: { contains: search } }
      ];
    }

    const [projects, totalRecords] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { project_created_at: "desc" },
        include: {
          _count: {
            select: { contacts: true, opportunities: true }
          }
        }
      }),
      prisma.project.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / take),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { project_name, project_location, project_date, project_type, project_is_active } = req.body;

    if (!project_location) {
      return res.status(400).json({ success: false, message: "Location is required" });
    }

    // Resolve tenant: client users always use their own tenant; superadmin may specify one
    let tenantId = req.user.tenantFk;
    if (req.user.role === "SUPER_ADMIN" && req.body.tenant_fk) {
      tenantId = req.body.tenant_fk;
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "No tenant context. Client users are auto-assigned; superadmin must provide tenant_fk.",
      });
    }

    const dataToSave = { tenant_fk: tenantId, project_location };

    if (project_name) dataToSave.project_name = project_name;
    if (project_type) dataToSave.project_type = project_type;
    if (project_is_active) dataToSave.project_is_active = project_is_active;
    if (project_date) dataToSave.project_date = new Date(project_date);

    const newProject = await prisma.project.create({
      data: dataToSave
    });

    res.status(201).json({ success: true, message: "Project created", data: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, project_location, project_date, project_type, project_is_active } = req.body;

    const dataToSave = {};

    if (project_name !== undefined) dataToSave.project_name = project_name;
    if (project_location !== undefined) dataToSave.project_location = project_location;
    if (project_type !== undefined) dataToSave.project_type = project_type;
    if (project_is_active !== undefined) dataToSave.project_is_active = project_is_active;
    if (project_date !== undefined) dataToSave.project_date = project_date ? new Date(project_date) : null;

    const updatedProject = await prisma.project.update({
      where: { project_id: id, ...getTenantFilter(req) },
      data: dataToSave
    });

    res.status(200).json({ success: true, message: "Project updated", data: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// DELETE /api/projects
export const deleteProjects = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of project IDs" });
    }

    await prisma.project.updateMany({
      where: { project_id: { in: ids }, ...getTenantFilter(req) },
      data: { project_deleted_at: new Date() },
    });

    res.status(200).json({ success: true, message: `${ids.length} projects deleted successfully` });
  } catch (error) {
    console.error("Error deleting projects:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
