using EnergiaApi.Api.Data;
using EnergiaApi.Api.Models;
using EnergiaApi.Api.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace EnergiaApi.Api.Services;

public class ConsumoService : IConsumoService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;

    public ConsumoService(AppDbContext db) => _db = db;

    public async Task<PagedResult<ConsumoViewModel>> ListarConsumosAsync(int page, int pageSize)
    {
        (page, pageSize) = Normalizar(page, pageSize);

        var query = _db.Leituras
            .AsNoTracking()
            .OrderByDescending(l => l.DataHora);

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new ConsumoViewModel
            {
                Id = l.Id,
                Equipamento = l.Equipamento!.Nome,
                Setor = l.Equipamento.Setor,
                DataHora = l.DataHora,
                ConsumoKwh = l.ConsumoKwh
            })
            .ToListAsync();

        return new PagedResult<ConsumoViewModel>
        {
            Page = page,
            PageSize = pageSize,
            TotalItems = total,
            Items = items
        };
    }

    public async Task<PagedResult<AlertaViewModel>> ListarAlertasAsync(int page, int pageSize)
    {
        (page, pageSize) = Normalizar(page, pageSize);

        var query = _db.Alertas
            .AsNoTracking()
            .OrderByDescending(a => a.DataHora);

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AlertaViewModel
            {
                Id = a.Id,
                EquipamentoId = a.EquipamentoId,
                Equipamento = a.Equipamento!.Nome,
                DataHora = a.DataHora,
                Mensagem = a.Mensagem,
                ConsumoRegistrado = a.ConsumoRegistrado
            })
            .ToListAsync();

        return new PagedResult<AlertaViewModel>
        {
            Page = page,
            PageSize = pageSize,
            TotalItems = total,
            Items = items
        };
    }

    public async Task<ConsumoViewModel> RegistrarLeituraAsync(LeituraInputViewModel input)
    {
        var equipamento = await _db.Equipamentos.FindAsync(input.EquipamentoId)
            ?? throw new KeyNotFoundException("Equipamento não encontrado.");

        var leitura = new LeituraConsumo
        {
            EquipamentoId = input.EquipamentoId,
            ConsumoKwh = input.ConsumoKwh,
            DataHora = input.DataHora ?? DateTime.UtcNow
        };
        _db.Leituras.Add(leitura);

        if (input.ConsumoKwh > equipamento.LimiteConsumoKwh)
        {
            _db.Alertas.Add(new Alerta
            {
                EquipamentoId = equipamento.Id,
                DataHora = leitura.DataHora,
                ConsumoRegistrado = input.ConsumoKwh,
                Mensagem = $"Consumo {input.ConsumoKwh} kWh excedeu o limite de {equipamento.LimiteConsumoKwh} kWh."
            });
        }

        await _db.SaveChangesAsync();

        return new ConsumoViewModel
        {
            Id = leitura.Id,
            Equipamento = equipamento.Nome,
            Setor = equipamento.Setor,
            DataHora = leitura.DataHora,
            ConsumoKwh = leitura.ConsumoKwh
        };
    }

    public async Task<RelatorioViewModel> GerarRelatorioAsync(int equipamentoId)
    {
        var relatorio = await _db.Equipamentos
            .AsNoTracking()
            .Where(e => e.Id == equipamentoId)
            .Select(e => new RelatorioViewModel
            {
                EquipamentoId = e.Id,
                Equipamento = e.Nome,
                ConsumoTotalKwh = e.Leituras.Sum(l => (double?)l.ConsumoKwh) ?? 0,
                ConsumoMedioKwh = e.Leituras.Average(l => (double?)l.ConsumoKwh) ?? 0,
                MaiorPico = e.Leituras.Max(l => (double?)l.ConsumoKwh) ?? 0,
                QtdLeituras = e.Leituras.Count(),
                QtdAlertas = _db.Alertas.Count(a => a.EquipamentoId == e.Id)
            })
            .FirstOrDefaultAsync();

        return relatorio ?? throw new KeyNotFoundException("Equipamento não encontrado.");
    }

    private static (int page, int pageSize) Normalizar(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > MaxPageSize) pageSize = DefaultPageSize;
        return (page, pageSize);
    }
}
