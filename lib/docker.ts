import Docker from 'dockerode';

const docker = new Docker();

export async function runTool(tool: string, args: string[], target: string) {
  const containerName = `cyberforge-${tool}-${Date.now()}`;

  const imageMap: Record<string, string> = {
    nmap: 'instrumentisto/nmap',
    nuclei: 'projectdiscovery/nuclei',
    sqlmap: 'ghcr.io/sqlmapproject/sqlmap',
    ffuf: 'ghcr.io/ffuf/ffuf',
    // ...
  };

  const container = await docker.createContainer({
    Image: imageMap[tool],
    Cmd: [...args, target],
    HostConfig: {
      AutoRemove: true,
      NetworkMode: 'none', // sandbox forte
      Memory: 512 * 1024 * 1024,
    }
  });

  await container.start();
  const logs = await container.logs({ stdout: true, stderr: true });
  return logs.toString();
}
