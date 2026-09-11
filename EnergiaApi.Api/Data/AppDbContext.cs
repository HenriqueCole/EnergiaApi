using EnergiaApi.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Equipamento> Equipamentos => Set<Equipamento>();
    public DbSet<LeituraConsumo> Leituras => Set<LeituraConsumo>();
    public DbSet<Alerta> Alertas => Set<Alerta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LeituraConsumo>()
            .HasIndex(l => new { l.EquipamentoId, l.DataHora });

        modelBuilder.Entity<LeituraConsumo>()
            .HasIndex(l => l.DataHora);

        modelBuilder.Entity<Alerta>()
            .HasIndex(a => a.DataHora);

        modelBuilder.Entity<Equipamento>().HasData(
            new Equipamento { Id = 1, Nome = "Ar-condicionado Sala A", Setor = "Administrativo", PotenciaWatts = 1500, LimiteConsumoKwh = 10, Ativo = true },
            new Equipamento { Id = 2, Nome = "Servidor Datacenter", Setor = "TI", PotenciaWatts = 800, LimiteConsumoKwh = 20, Ativo = true }
        );
    }
}
